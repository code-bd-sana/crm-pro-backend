import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from './project.entity';
import { MilestoneStatus } from '../../../shared/enums/project.enum';
import { ApiProperty } from '@nestjs/swagger';

@Entity('project_milestones')
export class ProjectMilestone {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, (project) => project.milestones, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ApiProperty({ example: 'Phase 1 Delivery' })
  @Column({ length: 255 })
  title: string;

  @ApiProperty({ example: '2023-10-31', required: false })
  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: Date;

  @ApiProperty({ enum: MilestoneStatus, example: MilestoneStatus.PENDING })
  @Column({
    type: 'enum',
    enum: MilestoneStatus,
    default: MilestoneStatus.PENDING,
  })
  status: MilestoneStatus;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
