import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('invoice_items')
export class InvoiceItem {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Invoice, (invoice) => invoice.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @ApiProperty({ example: 'Web Design Services' })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ example: 10.5 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @ApiProperty({ example: 100.00 })
  @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 2 })
  unitPrice: number;

  @ApiProperty({ example: 1050.00 })
  @Column({ name: 'total_price', type: 'decimal', precision: 12, scale: 2 })
  totalPrice: number; // usually quantity * unitPrice
}
