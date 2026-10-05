import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';

import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { CreateMessageDto } from './dto/create-message.dto';

interface CurrentUserContext {
  id: string;
  roles?: string[];
  permissions?: string[];
}

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    @Inject(NotificationService)
    private readonly notificationService: Partial<NotificationService> = {} as NotificationService,
  ) {}

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

  private messageInclude() {
    return {
      sender: {
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
        },
      },
      receiver: {
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
        },
      },
      shop: {
        select: {
          id: true,
          name: true,
        },
      },
      order: {
        select: {
          id: true,
          status: true,
          totalCents: true,
          customerName: true,
        },
      },
    };
  }

  private serializeMessage(message: any) {
    return {
      id: message.id,
      shopId: message.shopId ?? null,
      orderId: message.orderId ?? null,
      senderId: message.senderId,
      receiverId: message.receiverId,
      subject: message.subject ?? null,
      content: message.content,
      status: message.status,
      isRead: Boolean(message.isRead),
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      sender: message.sender
        ? {
            id: message.sender.id,
            fullName: message.sender.fullName,
            avatarUrl: message.sender.avatarUrl ?? null,
          }
        : null,
      receiver: message.receiver
        ? {
            id: message.receiver.id,
            fullName: message.receiver.fullName,
            avatarUrl: message.receiver.avatarUrl ?? null,
          }
        : null,
      shop: message.shop
        ? {
            id: message.shop.id,
            name: message.shop.name,
          }
        : null,
      order: message.order
        ? {
            id: message.order.id,
            status: message.order.status,
            totalCents: message.order.totalCents,
            customerName: message.order.customerName,
          }
        : null,
    };
  }

  private async ensureReceiverExists(receiverId: string) {
    const recipient = await this.prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, fullName: true },
    });

    if (!recipient) {
      throw new NotFoundException('Recipient user not found.');
    }

    return recipient;
  }

  async createMessage(user: string | CurrentUserContext | null, dto: CreateMessageDto) {
    const requester = this.normalizeUser(user);
    if (!requester.id) {
      throw new ForbiddenException('Authentication required to send a message.');
    }

    if (!dto.content || !dto.content.trim()) {
      throw new BadRequestException('Message content is required.');
    }

    if (!dto.receiverId || !dto.receiverId.trim()) {
      throw new BadRequestException('A message recipient is required.');
    }

    if (dto.receiverId === requester.id) {
      throw new BadRequestException('A user cannot send a message to themselves.');
    }

    await this.ensureReceiverExists(dto.receiverId);

    if (dto.shopId) {
      const shop = await this.prisma.shop.findUnique({
        where: { id: dto.shopId },
        select: { id: true, ownerId: true, name: true },
      });

      if (!shop) {
        throw new NotFoundException('Shop not found.');
      }

      if (shop.ownerId !== dto.receiverId) {
        throw new BadRequestException('The receiver must be the owner of the selected shop.');
      }
    }

    if (dto.orderId) {
      const order = await this.prisma.order.findUnique({
        where: { id: dto.orderId },
        select: { id: true, userId: true, shopId: true, status: true },
      });

      if (!order) {
        throw new NotFoundException('Order not found.');
      }

      const isOrderOwner = order.userId === requester.id;
      const isShopOwner = dto.shopId ? order.shopId === dto.shopId : false;

      if (!isOrderOwner && !isShopOwner) {
        throw new BadRequestException('The order is not associated with this sender and shop context.');
      }

      if (dto.shopId && order.shopId !== dto.shopId) {
        throw new BadRequestException('The order does not belong to the selected shop.');
      }
    }

    const created = await this.prisma.message.create({
      data: {
        senderId: requester.id,
        receiverId: dto.receiverId,
        shopId: dto.shopId ?? null,
        orderId: dto.orderId ?? null,
        subject: dto.subject?.trim() || null,
        content: dto.content.trim(),
        status: 'SENT',
        isRead: false,
      },
      include: this.messageInclude(),
    });

    if (this.notificationService.createNotification) {
      await this.notificationService.createNotification(dto.receiverId, {
        type: 'MESSAGE',
        title: 'Nouveau message',
        message: dto.content.trim(),
        relatedEntityType: 'MESSAGE',
        relatedEntityId: created.id,
      });
    }

    if (this.notificationService.recordAnalyticsEvent) {
      await this.notificationService.recordAnalyticsEvent({
        userId: requester.id,
        shopId: dto.shopId ?? null,
        eventType: 'MESSAGE_SENT',
        metadata: {
          messageId: created.id,
          receiverId: dto.receiverId,
          orderId: dto.orderId ?? null,
        },
      });
    }

    return this.serializeMessage(created);
  }

  async listMessagesForUser(
    user: string | CurrentUserContext | null,
    filters?: { shopId?: string; orderId?: string },
  ) {
    const requester = this.normalizeUser(user);
    if (!requester.id) {
      throw new ForbiddenException('Authentication required to read messages.');
    }

    const messages = await this.prisma.message.findMany({
      where: {
        OR: [{ senderId: requester.id }, { receiverId: requester.id }],
        ...(filters?.shopId ? { shopId: filters.shopId } : {}),
        ...(filters?.orderId ? { orderId: filters.orderId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: this.messageInclude(),
    });

    return messages.map((message) => this.serializeMessage(message));
  }

  async getConversationForUser(
    user: string | CurrentUserContext | null,
    otherUserId: string,
    filters?: { shopId?: string; orderId?: string },
  ) {
    const requester = this.normalizeUser(user);
    if (!requester.id) {
      throw new ForbiddenException('Authentication required to access a conversation.');
    }

    if (!otherUserId || !otherUserId.trim()) {
      throw new BadRequestException('The conversation partner is required.');
    }

    if (otherUserId === requester.id) {
      throw new BadRequestException('A conversation cannot be opened with yourself.');
    }

    const partner = await this.prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true },
    });

    if (!partner) {
      throw new NotFoundException('Conversation partner not found.');
    }

    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: requester.id, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: requester.id },
        ],
        ...(filters?.shopId ? { shopId: filters.shopId } : {}),
        ...(filters?.orderId ? { orderId: filters.orderId } : {}),
      },
      orderBy: { createdAt: 'asc' },
      include: this.messageInclude(),
    });

    return messages.map((message) => this.serializeMessage(message));
  }

  async getMessageForUser(user: string | CurrentUserContext | null, messageId: string) {
    const requester = this.normalizeUser(user);
    if (!requester.id) {
      throw new ForbiddenException('Authentication required to access a message.');
    }

    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: this.messageInclude(),
    });

    if (!message) {
      throw new NotFoundException('Message not found.');
    }

    const hasAccess = message.senderId === requester.id || message.receiverId === requester.id;
    if (!hasAccess) {
      throw new ForbiddenException('You are not allowed to access this message.');
    }

    if (message.receiverId === requester.id && !message.isRead) {
      const updated = await this.prisma.message.update({
        where: { id: messageId },
        data: { isRead: true, status: 'READ' },
        include: this.messageInclude(),
      });

      return this.serializeMessage(updated);
    }

    return this.serializeMessage(message);
  }

  async markMessageAsRead(user: string | CurrentUserContext | null, messageId: string) {
    const requester = this.normalizeUser(user);
    if (!requester.id) {
      throw new ForbiddenException('Authentication required to read a message.');
    }

    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        status: true,
        isRead: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found.');
    }

    if (message.receiverId !== requester.id) {
      throw new ForbiddenException('Only the recipient can mark this message as read.');
    }

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        isRead: true,
        status: 'READ',
      },
      include: this.messageInclude(),
    });

    return this.serializeMessage(updated);
  }
}
