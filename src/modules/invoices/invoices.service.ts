import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { Payment } from './entities/payment.entity';
import { Client } from '../clients/entities/client.entity';
import { Project } from '../projects/entities/project.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { InvoiceStatus } from '../../shared/enums/invoice.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationType, ResourceType } from '../../shared/enums/notification.enum';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async generateInvoiceNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const prefix = `INV-${year}-${month}-`;

    const lastInvoice = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.invoiceNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('invoice.createdAt', 'DESC')
      .getOne();

    if (!lastInvoice) {
      return `${prefix}0001`;
    }

    const lastNumberStr = lastInvoice.invoiceNumber.replace(prefix, '');
    const lastNumber = parseInt(lastNumberStr, 10);
    const newNumber = lastNumber + 1;

    return `${prefix}${String(newNumber).padStart(4, '0')}`;
  }

  async create(dto: CreateInvoiceDto): Promise<Invoice> {
    const client = await this.clientRepository.findOneBy({ id: dto.clientId });
    if (!client) throw new NotFoundException('Client not found');

    let project: Project | null = null;
    if (dto.projectId) {
      project = await this.projectRepository.findOneBy({ id: dto.projectId });
      if (!project) throw new NotFoundException('Project not found');
    }

    const invoiceNumber = await this.generateInvoiceNumber();

    // Calculate totals
    const subTotal = dto.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxAmount = dto.taxAmount || 0;
    const discountAmount = dto.discountAmount || 0;
    const totalAmount = subTotal + taxAmount - discountAmount;

    // Use transaction to save invoice and items together safely
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const invoice = this.invoiceRepository.create({
        invoiceNumber,
        client,
        ...(project && { project }),
        issueDate: dto.issueDate as unknown as Date,
        dueDate: dto.dueDate as unknown as Date,
        currency: dto.currency,
        notes: dto.notes,
        termsAndConditions: dto.termsAndConditions,
        subTotal,
        taxAmount,
        discountAmount,
        totalAmount,
        balanceDue: totalAmount,
        amountPaid: 0,
        status: InvoiceStatus.DRAFT,
      });

      const savedInvoice = await queryRunner.manager.save(invoice) as Invoice;

      const items = dto.items.map((itemDto) =>
        queryRunner.manager.create(InvoiceItem, {
          description: itemDto.description,
          quantity: itemDto.quantity,
          unitPrice: itemDto.unitPrice,
          totalPrice: itemDto.quantity * itemDto.unitPrice,
          invoice: savedInvoice,
        }),
      );

      await queryRunner.manager.save(items);
      await queryRunner.commitTransaction();

      return this.findOne(savedInvoice.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(query: QueryInvoiceDto) {
    const { page, limit, clientId, projectId, status } = query;
    const skip = (page - 1) * limit;

    const qb = this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.client', 'client')
      .leftJoinAndSelect('invoice.project', 'project')
      .where('invoice.deleted_at IS NULL');

    if (clientId) {
      qb.andWhere('client.id = :clientId', { clientId });
    }
    if (projectId) {
      qb.andWhere('project.id = :projectId', { projectId });
    }
    if (status) {
      qb.andWhere('invoice.status = :status', { status });
    }

    qb.orderBy('invoice.created_at', 'DESC').skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: {
        client: { user: true },
        project: true,
        items: true,
        payments: true,
      },
    });

    if (!invoice) throw new NotFoundException(`Invoice with ID "${id}" not found.`);
    return invoice;
  }

  async update(id: string, dto: UpdateInvoiceDto): Promise<Invoice> {
    const invoice = await this.findOne(id);
    Object.assign(invoice, dto);
    return this.invoiceRepository.save(invoice);
  }

  async addPayment(invoiceId: string, dto: CreatePaymentDto): Promise<Payment> {
    const invoice = await this.findOne(invoiceId);

    const payment = this.paymentRepository.create({
      amount: dto.amount,
      paymentDate: dto.paymentDate as unknown as Date,
      paymentMethod: dto.paymentMethod,
      transactionId: dto.transactionId,
      invoice,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // Update invoice balance and status.
    // NOTE: invoice.payments is a stale loaded collection here — saving the
    // hydrated entity would null the FK of any payment missing from it, so
    // update only the scalar columns instead.
    const newAmountPaid = Number(invoice.amountPaid) + Number(dto.amount);
    const newBalanceDue = Number(invoice.totalAmount) - newAmountPaid;

    const updates: Partial<Invoice> = {
      amountPaid: newAmountPaid,
      balanceDue: newBalanceDue < 0 ? 0 : newBalanceDue,
    };

    if (newBalanceDue <= 0) {
      updates.status = InvoiceStatus.PAID;

      // Emit event for invoice paid
      this.eventEmitter.emit('notification.send', {
        userId: invoice.client?.user?.id || null,
        title: 'Invoice Paid',
        message: `Invoice ${invoice.invoiceNumber} has been fully paid.`,
        type: NotificationType.INVOICE_PAID,
        resourceType: ResourceType.INVOICE,
        resourceId: invoice.id,
      });
    } else if (newAmountPaid > 0) {
      updates.status = InvoiceStatus.PARTIALLY_PAID;
    }

    await this.invoiceRepository.update(invoice.id, updates);

    return savedPayment;
  }
}
