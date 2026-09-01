import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Department } from '../../departments/entities/department.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('user_profiles')
export class UserProfile {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ example: 'John' })
  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @ApiProperty({ example: 'Doe', required: false })
  @Column({ name: 'last_name', length: 100, nullable: true })
  lastName: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @Column({ length: 50, nullable: true })
  phone: string;

  @ApiProperty({ type: () => Department, required: false })
  @ManyToOne(() => Department, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @ApiProperty({ example: 'Software Engineer', required: false })
  @Column({ name: 'job_title', length: 100, nullable: true })
  jobTitle: string;

  @ApiProperty({ example: 'A brief bio', required: false })
  @Column({ type: 'text', nullable: true })
  bio: string;

  @ApiProperty({ example: 'New York, USA', required: false })
  @Column({ length: 255, nullable: true })
  location: string;

  @ApiProperty({ example: 'America/New_York', required: false })
  @Column({ length: 100, nullable: true })
  timezone: string;

  @ApiProperty({ example: { linkedin: 'url' }, required: false })
  @Column({ name: 'social_links', type: 'jsonb', nullable: true })
  socialLinks: Record<string, string>;

  @ApiProperty({ example: '2023-01-01', required: false })
  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: Date;

  @ApiProperty({ example: 'https://example.com/avatar.png', required: false })
  @Column({ name: 'avatar_url', length: 500, nullable: true })
  avatarUrl: string;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
