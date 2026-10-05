import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

import { OrderService } from '../src/orders/order.service';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('OrderService', () => {
  let prisma: jest.Mocked<PrismaService>;
  let notificationService: { createNotification: jest.Mock; recordAnalyticsEvent: jest.Mock };
  let service: OrderService;

  beforeEach(() => {
    prisma = {
      product: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      productVariant: {
        findUnique: jest.fn(),
      },
      order: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      orderItem: {
        createMany: jest.fn(),
      },
      shop: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'shop_1',
          ownerId: 'shop_owner',
          name: 'Boutique Élan',
        }),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    } as any;

    notificationService = {
      createNotification: jest.fn().mockResolvedValue({ id: 'notif_1' }),
      recordAnalyticsEvent: jest.fn().mockResolvedValue({ id: 'event_1' }),
    };

    service = new OrderService(prisma, notificationService as any);
  });

  it('adds a valid product to the cart with a calculated subtotal', async () => {
    (prisma.product.findUnique as jest.Mock).mockResolvedValue({
      id: 'product_1',
      shopId: 'shop_1',
      name: 'T-shirt Premium',
      slug: 't-shirt-premium',
      priceCents: 2500,
      stockQuantity: 12,
      status: 'ACTIVE',
      isPublished: true,
      shop: { status: 'PUBLISHED' },
      variants: [],
    });

    const result = await service.addItemToCart('user_1', { productId: 'product_1', quantity: 2 });

    expect(result.items).toHaveLength(1);
    expect(result.subtotalCents).toBe(5000);
    expect(result.items[0].quantity).toBe(2);
  });

  it('rejects an unavailable product when it is not published or active', async () => {
    (prisma.product.findUnique as jest.Mock).mockResolvedValue({
      id: 'product_2',
      shopId: 'shop_1',
      name: 'Produit caché',
      slug: 'produit-cache',
      priceCents: 5000,
      stockQuantity: 5,
      status: 'DRAFT',
      isPublished: false,
      shop: { status: 'PUBLISHED' },
      variants: [],
    });

    await expect(
      service.addItemToCart('user_1', { productId: 'product_2', quantity: 1 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('creates an order from the cart and calculates totals server-side', async () => {
    (prisma.product.findUnique as jest.Mock).mockResolvedValue({
      id: 'product_1',
      shopId: 'shop_1',
      name: 'T-shirt Premium',
      slug: 't-shirt-premium',
      priceCents: 2500,
      stockQuantity: 12,
      status: 'ACTIVE',
      isPublished: true,
      shop: { id: 'shop_1', status: 'PUBLISHED', ownerId: 'shop_owner' },
      variants: [],
    });

    const cart = await service.addItemToCart('user_1', { productId: 'product_1', quantity: 2 });
    expect(cart.items[0].quantity).toBe(2);

    (prisma.order.create as jest.Mock).mockResolvedValue({
      id: 'order_1',
      userId: 'user_1',
      shopId: 'shop_1',
      status: 'PENDING',
      subtotalCents: 5000,
      shippingCents: 0,
      discountCents: 0,
      totalCents: 5000,
      customerName: 'Client Test',
      customerEmail: 'client@example.com',
      deliveryAddress: 'Lubumbashi',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    (prisma.orderItem.createMany as jest.Mock).mockResolvedValue({ count: 1 });
    (prisma.product.update as jest.Mock).mockResolvedValue({
      id: 'product_1',
      stockQuantity: 10,
    });

    const result = await service.checkoutCart('user_1', {
      customerName: 'Client Test',
      customerEmail: 'client@example.com',
      customerPhone: '+243000000000',
      deliveryAddress: 'Lubumbashi',
      deliveryCity: 'Lubumbashi',
      deliveryCountry: 'RDC',
      notes: 'Commande de test',
    });

    expect(result.totalCents).toBe(5000);
    expect(result.status).toBe('PENDING');
    expect(prisma.order.create).toHaveBeenCalled();
  });

  it('generates a WhatsApp message for a valid order with persisted shop and client details', async () => {
    const orderPayload = {
      id: 'order_2',
      userId: 'user_1',
      shopId: 'shop_1',
      status: 'PENDING',
      subtotalCents: 5000,
      shippingCents: 0,
      discountCents: 0,
      totalCents: 5000,
      customerName: 'Client Test',
      customerEmail: 'client@example.com',
      customerPhone: '+243990000001',
      deliveryAddress: 'Lubumbashi, Quartier Kenya',
      deliveryCity: 'Lubumbashi',
      deliveryCountry: 'RDC',
      notes: 'Livraison rapide',
      createdAt: new Date('2026-10-05T12:00:00Z'),
      updatedAt: new Date('2026-10-05T12:00:00Z'),
      items: [
        {
          id: 'item_1',
          productId: 'product_1',
          productVariantId: null,
          name: 'T-shirt Premium',
          quantity: 2,
          unitPriceCents: 2500,
          totalPriceCents: 5000,
        },
      ],
      shop: {
        id: 'shop_1',
        name: 'Boutique Élan',
        whatsapp: '+243970000000',
      },
    };

    (prisma.order.findUnique as jest.Mock).mockResolvedValue(orderPayload);
    (prisma.order.update as jest.Mock).mockResolvedValue({ ...orderPayload, status: 'PROCESSING' });

    const result = await service.prepareOrderForWhatsApp('user_1', 'order_2');

    expect(result.message).toContain('Réf. commande');
    expect(result.message).toContain('Boutique Élan');
    expect(result.message).toContain('T-shirt Premium');
    expect(result.message).toContain('2 x');
    expect(result.message).toContain('Client Test');
    expect(result.whatsappUrl).toContain('https://wa.me/243970000000');
    expect(result.orderStatus).toBe('PROCESSING');
  });

  it('forbids access to another user order', async () => {
    (prisma.order.findUnique as jest.Mock).mockResolvedValue({
      id: 'order_2',
      userId: 'another_user',
      shopId: 'shop_1',
      status: 'PENDING',
      subtotalCents: 1000,
      shippingCents: 0,
      discountCents: 0,
      totalCents: 1000,
      customerName: 'Autre',
      customerEmail: 'autre@example.com',
    });

    await expect(service.getOrderForUser('user_1', 'order_2')).rejects.toThrow(ForbiddenException);
  });

  it('throws when a cart item does not exist and cannot be removed', () => {
    expect(() => service.removeItemFromCart('user_1', 'missing_product')).toThrow(NotFoundException);
  });
});
