import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { Project } from '../../projects/entities/project.entity';
import { Currency, InvoiceStatus } from '../../../shared/enums/invoice.enum';
import { InvoiceItem } from './invoice-item.entity';
import { Payment } from './payment.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('invoices')
export class Invoice {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'INV-2023-001' })
  @Column({ name: 'invoice_number', unique: true })
  invoiceNumber: string;

  @ApiProperty({ type: () => Client })
  @ManyToOne(() => Client, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @ApiProperty({ type: () => Project, required: false })
  @ManyToOne(() => Project, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ApiProperty({ example: '2023-01-01' })
  @Column({ name: 'issue_date', type: 'date' })
  issueDate: Date;

  @ApiProperty({ example: '2023-01-15' })
  @Column({ name: 'due_date', type: 'date' })
  dueDate: Date;

  @ApiProperty({ enum: InvoiceStatus, example: InvoiceStatus.DRAFT })
  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  status: InvoiceStatus;

  @ApiProperty({ enum: Currency, example: Currency.BDT })
  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.BDT,
  })
  currency: Currency;

  // Financials
  @ApiProperty({ example: 1000.00 })
  @Column({ name: 'sub_total', type: 'decimal', precision: 12, scale: 2, default: 0 })
  subTotal: number;

  @ApiProperty({ example: 150.00 })
  @Column({ name: 'tax_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  taxAmount: number;

  @ApiProperty({ example: 50.00 })
  @Column({ name: 'discount_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  discountAmount: number;

  @ApiProperty({ example: 1100.00 })
  @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalAmount: number;

  @ApiProperty({ example: 500.00 })
  @Column({ name: 'amount_paid', type: 'decimal', precision: 12, scale: 2, default: 0 })
  amountPaid: number;

  @ApiProperty({ example: 600.00 })
  @Column({ name: 'balance_due', type: 'decimal', precision: 12, scale: 2, default: 0 })
  balanceDue: number;

  // Additional details
  @ApiProperty({ example: 'Thank you for your business.', required: false })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({ example: 'Please pay within 15 days.', required: false })
  @Column({ name: 'terms_and_conditions', type: 'text', nullable: true })
  termsAndConditions: string;

  // Relations
  @ApiProperty({ type: () => [InvoiceItem] })
  @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true })
  items: InvoiceItem[];

  @ApiProperty({ type: () => [Payment] })
  @OneToMany(() => Payment, (payment) => payment.invoice)
  payments: Payment[];

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;
}
