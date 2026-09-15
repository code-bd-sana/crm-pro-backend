import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationType, ResourceType } from '../../shared/enums/notification.enum';
import { NotificationsGateway } from './notifications.gateway';

interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  resourceType?: ResourceType;
  resourceId?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  @OnEvent('notification.send')
  async handleNotificationSend(payload: NotificationPayload) {
    if (!payload.userId) return; // Skip if no user to send to

    const notification = this.notificationRepository.create({
      user: { id: payload.userId },
      title: payload.title,
      message: payload.message,
      type: payload.type,
      resourceType: payload.resourceType,
      resourceId: payload.resourceId,
    });
    
    await this.notificationRepository.save(notification);
    
    // Push real-time notification to user via WebSocket
    this.notificationsGateway.sendNotificationToUser(payload.userId, notification);
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, user: { id: userId } },
    });

    if (!notification) throw new NotFoundException('Notification not found');
    
    notification.isRead = true;
    return this.notificationRepository.save(notification);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { user: { id: userId }, isRead: false },
    });
  }

  async markAllAsRead(userId: string): Promise<{ message: string }> {
    await this.notificationRepository.update(
      { user: { id: userId }, isRead: false },
      { isRead: true },
    );
    return { message: 'All notifications marked as read' };
  }
}
