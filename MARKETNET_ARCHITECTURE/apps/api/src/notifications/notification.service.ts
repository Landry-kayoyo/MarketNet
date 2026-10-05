import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../common/prisma/prisma.service';

interface CurrentUserContext {
  id: string;
  roles?: string[];
  permissions?: string[];
}

export interface CreateNotificationDto {
  type: 'ORDER' | 'MESSAGE' | 'REVIEW' | 'SYSTEM';
  title: string;
  message: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
}

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeUser(user: string | CurrentUserContext | null): CurrentUserContext {
    if (!user) {
      return { id: '', roles: [], permissions: [] };
    }

    if (typeof user === 'string') {
      return { id: user, roles: [], permissions: [] };
    }

    return {
      id: user.id,
      roles: user.roles ?? [],
      permissions: user.permissions ?? [],
    };
  }

  private serializeNotification(notification: any) {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: Boolean(notification.isRead),
      relatedEntityType: notification.relatedEntityType ?? null,
      relatedEntityId: notification.relatedEntityId ?? null,
      createdAt: notification.createdAt,
    };
  }

  private sanitizeMetadata(metadata?: Record<string, unknown>) {
    if (!metadata || typeof metadata !== 'object') {
      return {};
    }

    return Object.entries(metadata).reduce((acc, [key, value]) => {
      if (value === undefined || value === null) {
        return acc;
      }

      if (typeof value === 'string' && value.length > 2000) {
        acc[key] = value.slice(0, 2000);
        return acc;
      }

      acc[key] = value;
      return acc;
    }, {} as Record<string, unknown>);
  }

  async createNotification(userId: string, dto: CreateNotificationDto) {
    if (!userId || !userId.trim()) {
      throw new BadRequestException('A user id is required to create a notification.');
    }

    if (!dto?.type || !dto.title?.trim() || !dto.message?.trim()) {
      throw new BadRequestException('Notification type, title and message are required.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('Recipient user not found.');
    }

    const created = await this.prisma.notification.create({
      data: {
        userId,
        type: dto.type,
        title: dto.title.trim(),
        message: dto.message.trim(),
        relatedEntityType: dto.relatedEntityType ?? null,
        relatedEntityId: dto.relatedEntityId ?? null,
        isRead: false,
      },
    });

    return this.serializeNotification(created);
  }

  async listNotificationsForUser(
    user: string | CurrentUserContext | null,
    unreadOnly = false,
  ) {
    const requester = this.normalizeUser(user);

    if (!requester.id) {
      throw new ForbiddenException('Authentication required to access notifications.');
    }

    const notifications = await this.prisma.notification.findMany({
      where: {
        userId: requester.id,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    return notifications.map((notification: any) => this.serializeNotification(notification));
  }

  async getNotificationForUser(user: string | CurrentUserContext | null, notificationId: string) {
    const requester = this.normalizeUser(user);

    if (!requester.id) {
      throw new ForbiddenException('Authentication required to access notifications.');
    }

    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    if (notification.userId !== requester.id) {
      throw new ForbiddenException('You cannot access another user notification.');
    }

    return this.serializeNotification(notification);
  }

  async markNotificationAsRead(user: string | CurrentUserContext | null, notificationId: string) {
    const requester = this.normalizeUser(user);

    if (!requester.id) {
      throw new ForbiddenException('Authentication required to manage notifications.');
    }

    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    if (notification.userId !== requester.id) {
      throw new ForbiddenException('You cannot update another user notification.');
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return this.serializeNotification(updated);
  }

  async markAllNotificationsAsRead(user: string | CurrentUserContext | null) {
    const requester = this.normalizeUser(user);

    if (!requester.id) {
      throw new ForbiddenException('Authentication required to manage notifications.');
    }

    const result = await this.prisma.notification.updateMany({
      where: {
        userId: requester.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    return {
      userId: requester.id,
      updatedCount: result.count,
    };
  }

  async recordAnalyticsEvent(payload: {
    userId?: string | null;
    shopId?: string | null;
    productId?: string | null;
    eventType: string;
    sessionId?: string | null;
    ipHash?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    if (!payload.eventType) {
      throw new BadRequestException('An analytics event type is required.');
    }

    if (payload.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true },
      });

      if (!user) {
        throw new NotFoundException('User not found for analytics event.');
      }
    }

    const created = await this.prisma.analyticsEvent.create({
      data: {
        userId: payload.userId ?? null,
        shopId: payload.shopId ?? null,
        productId: payload.productId ?? null,
        eventType: payload.eventType as any,
        sessionId: payload.sessionId ?? null,
        ipHash: payload.ipHash ?? null,
        metadata: this.sanitizeMetadata(payload.metadata ?? {}) as any,
      },
    });

    return {
      id: created.id,
      userId: created.userId,
      shopId: created.shopId,
      productId: created.productId,
      eventType: created.eventType,
      metadata: created.metadata ?? {},
      createdAt: created.createdAt,
    };
  }
}
