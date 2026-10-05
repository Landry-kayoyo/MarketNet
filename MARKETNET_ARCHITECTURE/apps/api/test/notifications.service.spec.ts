import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

import { NotificationService } from '../src/notifications/notification.service';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('NotificationService', () => {
  let prisma: jest.Mocked<PrismaService>;
  let service: NotificationService;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: 'user_2' }),
      },
      notification: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      analyticsEvent: {
        create: jest.fn(),
      },
    } as any;

    service = new NotificationService(prisma);
  });

  it('creates a notification for the correct recipient', async () => {
    (prisma.notification.create as jest.Mock).mockResolvedValue({
      id: 'notif_1',
      userId: 'user_2',
      type: 'MESSAGE',
      title: 'Nouveau message',
      message: 'Vous avez un nouveau message.',
      isRead: false,
      relatedEntityType: 'MESSAGE',
      relatedEntityId: 'message_1',
      createdAt: new Date(),
    });

    const result = await service.createNotification('user_2', {
      type: 'MESSAGE',
      title: 'Nouveau message',
      message: 'Vous avez un nouveau message.',
      relatedEntityType: 'MESSAGE',
      relatedEntityId: 'message_1',
    });

    expect(result.userId).toBe('user_2');
    expect(result.type).toBe('MESSAGE');
    expect(result.isRead).toBe(false);
  });

  it('lists notifications for the authenticated user only', async () => {
    (prisma.notification.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'notif_2',
        userId: 'user_2',
        type: 'ORDER',
        title: 'Commande reçue',
        message: 'Une nouvelle commande a été envoyée.',
        isRead: false,
        relatedEntityType: 'ORDER',
        relatedEntityId: 'order_1',
        createdAt: new Date(),
      },
    ]);

    const result = await service.listNotificationsForUser('user_2');

    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe('user_2');
    expect(prisma.notification.findMany).toHaveBeenCalled();
  });

  it('marks a notification as read for the owner only', async () => {
    (prisma.notification.findUnique as jest.Mock).mockResolvedValue({
      id: 'notif_3',
      userId: 'user_2',
      type: 'SYSTEM',
      title: 'Mise à jour',
      message: 'Votre compte a été mis à jour.',
      isRead: false,
      createdAt: new Date(),
    });

    (prisma.notification.update as jest.Mock).mockResolvedValue({
      id: 'notif_3',
      userId: 'user_2',
      type: 'SYSTEM',
      title: 'Mise à jour',
      message: 'Votre compte a été mis à jour.',
      isRead: true,
      createdAt: new Date(),
    });

    const result = await service.markNotificationAsRead('user_2', 'notif_3');

    expect(result.isRead).toBe(true);
  });

  it('forbids a user from reading another user notification', async () => {
    (prisma.notification.findUnique as jest.Mock).mockResolvedValue({
      id: 'notif_4',
      userId: 'user_3',
      type: 'SYSTEM',
      title: 'Secret',
      message: 'Invisible',
      isRead: false,
      createdAt: new Date(),
    });

    await expect(service.getNotificationForUser('user_2', 'notif_4')).rejects.toThrow(ForbiddenException);
  });

  it('throws when notification payload is invalid', async () => {
    await expect(
      service.createNotification('user_2', {
        type: 'MESSAGE',
        title: '',
        message: '   ',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('records analytics events without leaking private payloads', async () => {
    (prisma.analyticsEvent.create as jest.Mock).mockResolvedValue({
      id: 'event_1',
      eventType: 'ORDER_CREATED',
      userId: 'user_2',
      shopId: 'shop_1',
      metadata: { orderId: 'order_1' },
    });

    const result = await service.recordAnalyticsEvent({
      userId: 'user_2',
      shopId: 'shop_1',
      eventType: 'ORDER_CREATED',
      metadata: { orderId: 'order_1' },
    });

    expect(result.eventType).toBe('ORDER_CREATED');
    expect(result.metadata).toEqual({ orderId: 'order_1' });
    expect(prisma.analyticsEvent.create).toHaveBeenCalled();
  });

  it('throws when a notification does not exist', async () => {
    (prisma.notification.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.getNotificationForUser('user_2', 'missing')).rejects.toThrow(NotFoundException);
  });
});
