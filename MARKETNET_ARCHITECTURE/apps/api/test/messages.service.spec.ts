import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

import { MessageService } from '../src/messages/message.service';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('MessageService', () => {
  let prisma: jest.Mocked<PrismaService>;
  let notificationService: { createNotification: jest.Mock; recordAnalyticsEvent: jest.Mock };
  let service: MessageService;

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn() },
      shop: { findUnique: jest.fn() },
      order: { findUnique: jest.fn() },
      message: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    } as any;

    notificationService = {
      createNotification: jest.fn().mockResolvedValue({ id: 'notif_1' }),
      recordAnalyticsEvent: jest.fn().mockResolvedValue({ id: 'event_1' }),
    };

    service = new MessageService(prisma, notificationService as any);
  });

  it('creates an allowed message between a customer and a shop owner', async () => {
    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: 'customer_1', fullName: 'Client Test' })
      .mockResolvedValueOnce({ id: 'merchant_1', fullName: 'Boutique A' });

    (prisma.shop.findUnique as jest.Mock).mockResolvedValue({
      id: 'shop_1',
      ownerId: 'merchant_1',
      name: 'Boutique A',
    });

    (prisma.order.findUnique as jest.Mock).mockResolvedValue({
      id: 'order_1',
      userId: 'customer_1',
      shopId: 'shop_1',
      status: 'PENDING',
    });

    (prisma.message.create as jest.Mock).mockResolvedValue({
      id: 'message_1',
      shopId: 'shop_1',
      orderId: 'order_1',
      senderId: 'customer_1',
      receiverId: 'merchant_1',
      subject: 'Question produit',
      content: 'Le produit est-il disponible ?',
      status: 'SENT',
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      sender: { id: 'customer_1', fullName: 'Client Test' },
      receiver: { id: 'merchant_1', fullName: 'Boutique A' },
      shop: { id: 'shop_1', name: 'Boutique A' },
      order: { id: 'order_1' },
    });

    const result = await service.createMessage('customer_1', {
      receiverId: 'merchant_1',
      shopId: 'shop_1',
      orderId: 'order_1',
      subject: 'Question produit',
      content: 'Le produit est-il disponible ?',
    });

    expect(result.content).toContain('Le produit est-il disponible ?');
    expect(result.senderId).toBe('customer_1');
    expect(result.receiverId).toBe('merchant_1');
    expect(notificationService.createNotification).toHaveBeenCalledWith(
      'merchant_1',
      expect.objectContaining({
        type: 'MESSAGE',
        title: expect.any(String),
        message: expect.stringContaining('Le produit est-il disponible ?'),
      }),
    );
  });

  it('marks a received message as read', async () => {
    (prisma.message.findUnique as jest.Mock).mockResolvedValue({
      id: 'message_2',
      senderId: 'customer_1',
      receiverId: 'merchant_1',
      isRead: false,
      status: 'SENT',
      content: 'Bonjour',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    (prisma.message.update as jest.Mock).mockResolvedValue({
      id: 'message_2',
      senderId: 'customer_1',
      receiverId: 'merchant_1',
      isRead: true,
      status: 'READ',
      content: 'Bonjour',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.markMessageAsRead('merchant_1', 'message_2');

    expect(result.isRead).toBe(true);
    expect(result.status).toBe('READ');
  });

  it('forbids access to a message that does not belong to the requester', async () => {
    (prisma.message.findUnique as jest.Mock).mockResolvedValue({
      id: 'message_3',
      senderId: 'other_user',
      receiverId: 'another_user',
      content: 'Secret',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(service.getMessageForUser('customer_1', 'message_3')).rejects.toThrow(ForbiddenException);
  });

  it('rejects a message creation when the shop owner does not match the announced receiver', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'merchant_1', fullName: 'Boutique A' });
    (prisma.shop.findUnique as jest.Mock).mockResolvedValue({
      id: 'shop_1',
      ownerId: 'merchant_2',
      name: 'Boutique B',
    });

    await expect(
      service.createMessage('customer_1', {
        receiverId: 'merchant_1',
        shopId: 'shop_1',
        content: 'Bonjour',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws when a message is empty or missing required content', async () => {
    await expect(
      service.createMessage('customer_1', {
        receiverId: 'merchant_1',
        content: '   ',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws when the message target does not exist', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      service.createMessage('customer_1', {
        receiverId: 'missing_user',
        content: 'Bonjour',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
