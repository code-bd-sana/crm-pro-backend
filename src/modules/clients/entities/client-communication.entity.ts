import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Client } from './client.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum CommunicationType {
  EMAIL = 'EMAIL',
  CALL = 'CALL',
  MEETING = 'MEETING',
  OTHER = 'OTHER',
}

@Entity('client_communications')
export class ClientCommunication {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Client, (client) => client.communications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @ApiProperty({ enum: CommunicationType, example: CommunicationType.EMAIL })
  @Column({ type: 'enum', enum: CommunicationType })
  type: CommunicationType;

  @ApiProperty({ example: 'Initial Intro Call' })
  @Column({ length: 255 })
  title: string;

  @ApiProperty({ example: '2023-01-01T10:00:00.000Z' })
  @Column({ name: 'communication_date', type: 'timestamp' })
  communicationDate: Date;

  @ApiProperty({ example: 'Discussed project requirements', required: false })
  @Column({ type: 'text', nullable: true })
  summary: string;

  @ApiProperty({ example: '2023-01-01T10:00:00.000Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ example: '2023-01-01T10:00:00.000Z' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
