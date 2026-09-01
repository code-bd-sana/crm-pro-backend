import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { User } from '../../users/entities/user.entity';
import { TaskPriority, TaskStatus } from '../../../shared/enums/task.enum';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tasks')
export class Task {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => Project })
  @ManyToOne(() => Project, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ApiProperty({ type: () => User, required: false })
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignee_id' })
  assignee: User;

  @ApiProperty({ example: 'Design Homepage' })
  @Column({ length: 255 })
  title: string;

  @ApiProperty({ example: 'Create wireframes for homepage', required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ enum: TaskPriority, example: TaskPriority.MEDIUM })
  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @ApiProperty({ enum: TaskStatus, example: TaskStatus.TODO })
  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status: TaskStatus;

  @ApiProperty({ example: '2023-12-31', required: false })
  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: Date;

  @ApiProperty({ example: ['design', 'frontend'], required: false })
  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;
}
