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
import { User } from '../../users/entities/user.entity';
import { ClientCommunication } from './client-communication.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum ClientStatus {
  LEAD = 'LEAD',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Entity('clients')
export class Client {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => User, required: false })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ example: 'Acme Corp' })
  @Column({ name: 'company_name', length: 255 })
  companyName: string;

  @ApiProperty({ example: 'John Doe', required: false })
  @Column({ name: 'contact_person', length: 150, nullable: true })
  contactPerson: string;

  @ApiProperty({ example: 'contact@acme.com' })
  @Column({ length: 255 })
  email: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @Column({ length: 50, nullable: true })
  phone: string;

  @ApiProperty({ example: 'https://acme.com', required: false })
  @Column({ length: 255, nullable: true })
  website: string;

  @ApiProperty({ example: 'Technology', required: false })
  @Column({ length: 100, nullable: true })
  industry: string;

  @ApiProperty({ example: '123 Tech Lane', required: false })
  @Column({ type: 'text', nullable: true })
  address: string;

  @ApiProperty({ example: ['tech', 'enterprise'], required: false })
  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @ApiProperty({ enum: ClientStatus, example: ClientStatus.LEAD })
  @Column({
    type: 'enum',
    enum: ClientStatus,
    default: ClientStatus.LEAD,
  })
  status: ClientStatus;

  @ApiProperty({ example: 'Important client', required: false })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({ type: () => [ClientCommunication], required: false })
  @OneToMany(() => ClientCommunication, (comm) => comm.client)
  communications: ClientCommunication[];

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;
}
