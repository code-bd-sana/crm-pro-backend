import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../shared/enums/permissions.enum';
import { Invoice } from './entities/invoice.entity';
import { Payment } from './entities/payment.entity';

@ApiTags('Invoices & Billing')
@ApiBearerAuth()
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @RequirePermissions(Permission.INVOICES_CREATE)
  @ApiOperation({ summary: 'Create a new invoice with line items' })
  @ApiResponse({ status: 201, description: 'Invoice created successfully.', type: Invoice })
  create(@Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(dto);
  }

  @Get()
  @RequirePermissions(Permission.INVOICES_READ)
  @ApiOperation({ summary: 'List invoices with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Invoices retrieved successfully.', type: [Invoice] })
  findAll(@Query() query: QueryInvoiceDto) {
    return this.invoicesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(Permission.INVOICES_READ)
  @ApiOperation({ summary: 'Get full invoice details (Hydrated response for PDF generation)' })
  @ApiResponse({ status: 200, description: 'Invoice with client, project, items, and payments retrieved.', type: Invoice })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(Permission.INVOICES_UPDATE)
  @ApiOperation({ summary: 'Update basic invoice details or status' })
  @ApiResponse({ status: 200, description: 'Invoice updated successfully.', type: Invoice })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoicesService.update(id, dto);
  }

  @Post(':id/payments')
  @RequirePermissions(Permission.INVOICES_UPDATE)
  @ApiOperation({ summary: 'Add a payment to an invoice (Auto-calculates balance)' })
  @ApiResponse({ status: 201, description: 'Payment recorded successfully.', type: Invoice })
  addPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.invoicesService.addPayment(id, dto);
  }
}
