import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Task } from './task.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('subtasks')
export class Subtask {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Task, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @ApiProperty({ example: 'Create mockups' })
  @Column({ length: 255 })
  title: string;

  @ApiProperty({ example: false })
  @Column({ name: 'is_completed', default: false })
  isCompleted: boolean;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
