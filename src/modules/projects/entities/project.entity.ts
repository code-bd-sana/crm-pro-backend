import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { User } from '../../users/entities/user.entity';
import { ProjectMilestone } from './project-milestone.entity';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectPriority, ProjectStatus } from '../../../shared/enums/project.enum';

@Entity('projects')
export class Project {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => Client })
  @ManyToOne(() => Client, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @ApiProperty({ example: 'CRM Development' })
  @Column({ length: 255 })
  title: string;

  @ApiProperty({ example: 'Develop a new CRM system', required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ example: 15000.50 })
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0.0 })
  budget: number;

  @ApiProperty({ enum: ProjectPriority, example: ProjectPriority.MEDIUM })
  @Column({
    type: 'enum',
    enum: ProjectPriority,
    default: ProjectPriority.MEDIUM,
  })
  priority: ProjectPriority;

  @ApiProperty({ enum: ProjectStatus, example: ProjectStatus.ACTIVE })
  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.ACTIVE,
  })
  status: ProjectStatus;

  @ApiProperty({ example: 25, description: 'Project completion percentage' })
  @Column({ type: 'int', default: 0 })
  progress: number;

  @ApiProperty({ example: '2023-01-01', required: false })
  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: Date;

  @ApiProperty({ example: '2023-12-31', required: false })
  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: Date;

  @ApiProperty({ type: () => [ProjectMilestone], required: false })
  @OneToMany(() => ProjectMilestone, (milestone) => milestone.project, {
    cascade: true,
  })
  milestones: ProjectMilestone[];

  @ApiProperty({ type: () => [User], required: false })
  @ManyToMany(() => User, { eager: false })
  @JoinTable({
    name: 'project_members',
    joinColumn: { name: 'project_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  members: User[];

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;
}
