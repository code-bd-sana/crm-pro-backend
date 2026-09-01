import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { NotificationType, ResourceType } from '../../../shared/enums/notification.enum';
import { ApiProperty } from '@nestjs/swagger';

@Entity('notifications')
export class Notification {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ example: 'New Task Assigned' })
  @Column({ length: 255 })
  title: string;

  @ApiProperty({ example: 'You have been assigned to task T-123' })
  @Column({ type: 'text' })
  message: string;

  @ApiProperty({ enum: NotificationType, example: NotificationType.SYSTEM_ALERT })
  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.SYSTEM_ALERT,
  })
  type: NotificationType;

  @ApiProperty({ example: false })
  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @ApiProperty({ enum: ResourceType, example: ResourceType.TASK, required: false })
  @Column({
    name: 'resource_type',
    type: 'enum',
    enum: ResourceType,
    nullable: true,
  })
  resourceType: ResourceType;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', required: false })
  @Column({ name: 'resource_id', type: 'uuid', nullable: true })
  resourceId: string;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
