import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

interface CartLine {
  productId: string;
  productVariantId: string | null;
  name: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
}

interface CurrentUserContext {
  id: string;
  roles?: string[];
  permissions?: string[];
}

@Injectable()
export class OrderService {
  private readonly carts = new Map<string, CartLine[]>();

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

  private getCart(userId: string): CartLine[] {
    return this.carts.get(userId) ?? [];
  }

  private buildCartSummary(items: CartLine[]) {
    const subtotalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);

    return {
      items,
      subtotalCents,
      totalCents: subtotalCents,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }

  private async getOrderableProduct(productId: string, productVariantId?: string | null) {
    const product: any = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { shop: true, variants: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    if (!product.isPublished || product.status !== 'ACTIVE') {
      throw new BadRequestException('This product is not available for purchase.');
    }

    if (product.shop.status !== 'PUBLISHED') {
      throw new BadRequestException('The shop for this product is not currently available.');
    }

    let variant: any = null;
    if (productVariantId) {
      variant = product.variants.find((item: any) => item.id === productVariantId) ?? null;
      if (!variant) {
        throw new BadRequestException('Selected product variant is invalid.');
      }
      if (!variant.isActive) {
        throw new BadRequestException('This product variant is no longer available.');
      }
    }

    const availableStock = variant ? variant.stockQuantity : product.stockQuantity;
    if (availableStock <= 0) {
      throw new BadRequestException('This product is out of stock.');
    }

    const unitPriceCents = variant?.priceCents ?? product.priceCents;

    return { product, variant, unitPriceCents, availableStock };
  }

  getCartForUser(userId: string) {
    return this.buildCartSummary(this.getCart(userId));
  }

  async addItemToCart(userId: string, dto: AddCartItemDto) {
    if (!dto.productId) {
      throw new BadRequestException('A product id is required.');
    }

    if (!dto.quantity || dto.quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1.');
    }

    const { product, variant, unitPriceCents, availableStock } = await this.getOrderableProduct(dto.productId, dto.productVariantId ?? null);
    const items = this.getCart(userId);
    const key = `${dto.productId}:${dto.productVariantId ?? 'base'}`;
    const existing = items.find((item) => `${item.productId}:${item.productVariantId ?? 'base'}` === key);
    const nextQuantity = existing ? existing.quantity + dto.quantity : dto.quantity;

    if (nextQuantity > availableStock) {
      throw new BadRequestException('Requested quantity exceeds the available stock.');
    }

    const line: CartLine = {
      productId: product.id,
      productVariantId: variant?.id ?? null,
      name: product.name,
      unitPriceCents,
      quantity: nextQuantity,
      lineTotalCents: unitPriceCents * nextQuantity,
    };

    if (existing) {
      const idx = items.findIndex((item) => `${item.productId}:${item.productVariantId ?? 'base'}` === key);
      items[idx] = line;
    } else {
      items.push(line);
    }

    this.carts.set(userId, items);
    return this.buildCartSummary(items);
  }

  async updateCartItem(userId: string, productId: string, dto: UpdateCartItemDto) {
    const items = this.getCart(userId);
    const key = `${productId}:${dto.productVariantId ?? 'base'}`;
    const existingIndex = items.findIndex((item) => `${item.productId}:${item.productVariantId ?? 'base'}` === key);

    if (existingIndex === -1) {
      throw new NotFoundException('This product is not in the cart.');
    }

    if (!dto.quantity || dto.quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1.');
    }

    const { product, variant, unitPriceCents, availableStock } = await this.getOrderableProduct(productId, dto.productVariantId ?? null);

    if (dto.quantity > availableStock) {
      throw new BadRequestException('Requested quantity exceeds the available stock.');
    }

    const newLine: CartLine = {
      productId: product.id,
      productVariantId: variant?.id ?? null,
      name: product.name,
      unitPriceCents,
      quantity: dto.quantity,
      lineTotalCents: unitPriceCents * dto.quantity,
    };

    items[existingIndex] = newLine;
    this.carts.set(userId, items);
    return this.buildCartSummary(items);
  }

  removeItemFromCart(userId: string, productId: string, productVariantId?: string | null) {
    const items = this.getCart(userId);
    const key = `${productId}:${productVariantId ?? 'base'}`;
    const existingIndex = items.findIndex((item) => `${item.productId}:${item.productVariantId ?? 'base'}` === key);

    if (existingIndex === -1) {
      throw new NotFoundException('This product is not in the cart.');
    }

    items.splice(existingIndex, 1);
    this.carts.set(userId, items);
    return this.buildCartSummary(items);
  }

  clearCart(userId: string) {
    this.carts.delete(userId);
    return { success: true };
  }

  private formatOrderReference(orderId: string) {
    return `MK-${orderId.slice(-8).toUpperCase()}`;
  }

  private formatCurrencyCents(value: number) {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      maximumFractionDigits: 0,
    }).format(value / 100);
  }

  private normalizeWhatsAppNumber(value?: string | null) {
    if (!value) {
      return '';
    }

    const digits = value.replace(/\D/g, '');
    if (!digits) {
      return '';
    }

    if (digits.startsWith('243')) {
      return `+${digits}`;
    }

    if (digits.startsWith('0')) {
      return `+243${digits.slice(1)}`;
    }

    return `+${digits}`;
  }

  private buildWhatsAppMessage(order: any) {
    const itemsText = (order.items ?? []).map((item: any) => {
      const variantLabel = item.productVariant ? ` (${item.productVariant.name || item.productVariant.value || 'Variante'})` : '';
      return `- ${item.quantity} x ${item.name}${variantLabel} — ${this.formatCurrencyCents(item.totalPriceCents)}`;
    }).join('\n');

    const address = [order.deliveryAddress, order.deliveryCity, order.deliveryCountry].filter(Boolean).join(', ') || 'À préciser';

    return [
      `Bonjour ${order.shop?.name ?? 'la boutique'},`,
      'Je souhaite commander la commande suivante.',
      '',
      `Réf. commande: ${this.formatOrderReference(order.id)}`,
      `Boutique: ${order.shop?.name ?? 'Boutique'}`,
      'Produits:',
      itemsText || '- Aucun article',
      '',
      `Sous-total: ${this.formatCurrencyCents(order.subtotalCents)}`,
      `Total: ${this.formatCurrencyCents(order.totalCents)}`,
      '',
      `Nom du client: ${order.customerName}`,
      `Téléphone: ${order.customerPhone ?? 'Non renseigné'}`,
      `Adresse: ${address}`,
      order.notes ? `Notes: ${order.notes}` : 'Notes: Aucune',
      '',
      'Merci de confirmer la commande.',
    ].join('\n');
  }

  async prepareOrderForWhatsApp(user: string | CurrentUserContext | null, orderId: string) {
    const requester = this.normalizeUser(user);
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        shop: true,
        items: {
          include: {
            product: true,
            productVariant: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    const isAdmin = requester.roles?.includes('admin');
    if (order.userId !== requester.id && !isAdmin) {
      throw new ForbiddenException('You are not allowed to access this order.');
    }

    if (!order.shop?.whatsapp) {
      throw new BadRequestException('This shop has not configured a WhatsApp number.');
    }

    const message = this.buildWhatsAppMessage(order);
    const whatsappNumber = this.normalizeWhatsAppNumber(order.shop.whatsapp);
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/^\+/, '')}?text=${encodeURIComponent(message)}`;

    const nextStatus = order.status === 'PENDING' ? 'PROCESSING' : order.status;
    const updatedOrder = await this.prisma.order.update({
      where: { id: order.id },
      data: { status: nextStatus as OrderStatus },
    });

    return {
      orderId: order.id,
      orderReference: this.formatOrderReference(order.id),
      orderStatus: updatedOrder.status,
      shopId: order.shopId,
      shopName: order.shop.name,
      whatsappNumber,
      whatsappUrl,
      message,
    };
  }

  async checkoutCart(userId: string, dto: CreateOrderDto) {
    const items = this.getCart(userId);

    if (!items.length) {
      throw new BadRequestException('Cart is empty.');
    }

    return this.prisma.$transaction(async (tx: any) => {
      let subtotalCents = 0;
      const normalizedItems: Array<{
        productId: string;
        productVariantId: string | null;
        name: string;
        quantity: number;
        unitPriceCents: number;
        totalPriceCents: number;
      }> = [];

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { shop: true, variants: true },
        });

        if (!product) {
          throw new NotFoundException('One or more products are no longer available.');
        }

        const isPubliclyAvailable = product.isPublished && product.status === 'ACTIVE' && product.shop.status === 'PUBLISHED';
        if (!isPubliclyAvailable) {
          throw new BadRequestException('One or more products are no longer available for purchase.');
        }

        const variant = item.productVariantId
          ? product.variants.find((variantItem: any) => variantItem.id === item.productVariantId) ?? null
          : null;

        if (item.productVariantId && !variant) {
          throw new BadRequestException('Selected product variant is invalid.');
        }

        if (variant && !variant.isActive) {
          throw new BadRequestException('Selected product variant is no longer available.');
        }

        const availableStock = variant ? variant.stockQuantity : product.stockQuantity;
        if (item.quantity > availableStock) {
          throw new BadRequestException(`Not enough stock for ${product.name}.`);
        }

        const unitPriceCents = variant?.priceCents ?? product.priceCents;
        const totalPriceCents = unitPriceCents * item.quantity;
        subtotalCents += totalPriceCents;

        normalizedItems.push({
          productId: product.id,
          productVariantId: variant?.id ?? null,
          name: product.name,
          quantity: item.quantity,
          unitPriceCents,
          totalPriceCents,
        });

        if (variant) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { stockQuantity: Math.max(0, variant.stockQuantity - item.quantity) },
          });
        } else {
          await tx.product.update({
            where: { id: product.id },
            data: { stockQuantity: Math.max(0, product.stockQuantity - item.quantity) },
          });
        }
      }

      const shippingCents = 0;
      const discountCents = 0;
      const totalCents = subtotalCents + shippingCents - discountCents;

      const order = await tx.order.create({
        data: {
          userId,
          shopId: items[0].productId ? (await tx.product.findUnique({ where: { id: items[0].productId }, include: { shop: true } })).shopId : null,
          status: 'PENDING' as OrderStatus,
          subtotalCents,
          shippingCents,
          discountCents,
          totalCents,
          customerName: dto.customerName,
          customerEmail: dto.customerEmail ?? null,
          customerPhone: dto.customerPhone ?? null,
          deliveryAddress: dto.deliveryAddress ?? null,
          deliveryCity: dto.deliveryCity ?? null,
          deliveryCountry: dto.deliveryCountry ?? null,
          notes: dto.notes ?? null,
        },
      });

      await tx.orderItem.createMany({
        data: normalizedItems.map((item) => ({
          orderId: order.id,
          productId: item.productId,
          productVariantId: item.productVariantId,
          name: item.name,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          totalPriceCents: item.totalPriceCents,
        })),
      });

      const shop = await tx.shop.findUnique({
        where: { id: order.shopId },
        select: { id: true, ownerId: true, name: true },
      });

      if (shop && this.notificationService.createNotification) {
        await this.notificationService.createNotification(shop.ownerId, {
          type: 'ORDER',
          title: 'Nouvelle commande reçue',
          message: `Une nouvelle commande a été enregistrée pour ${shop.name}.`,
          relatedEntityType: 'ORDER',
          relatedEntityId: order.id,
        });
      }

      if (this.notificationService.recordAnalyticsEvent) {
        await this.notificationService.recordAnalyticsEvent({
          userId,
          shopId: order.shopId,
          eventType: 'ORDER_CREATED',
          metadata: {
            orderId: order.id,
            itemCount: normalizedItems.length,
            totalCents,
          },
        });
      }

      this.carts.delete(userId);
      return {
        ...order,
        reference: this.formatOrderReference(order.id),
        items: normalizedItems,
        subTotalCents: subtotalCents,
        totalCents,
      };
    });
  }

  async getOrdersForUser(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });

    return orders.map((order) => ({
      ...order,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    }));
  }

  async getOrderForUser(user: string | CurrentUserContext | null, orderId: string) {
    const requester = this.normalizeUser(user);
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        shop: true,
        items: {
          include: {
            product: true,
            productVariant: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    const isAdmin = requester.roles?.includes('admin');
    if (order.userId !== requester.id && !isAdmin) {
      throw new ForbiddenException('You are not allowed to access this order.');
    }

    return {
      ...order,
      reference: this.formatOrderReference(order.id),
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }

  // ── Commande invité (sans authentification) ────────────────────────────────
  async guestCheckout(dto: import('./dto/create-guest-order.dto').CreateGuestOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Le panier est vide.');
    }

    return this.prisma.$transaction(async (tx: any) => {
      let subtotalCents = 0;
      let shopId: string | null = null;
      let orderShop: { id: string; name: string; whatsapp: string } | null = null;
      const normalizedItems: Array<{
        productId: string;
        productVariantId: string | null;
        name: string;
        quantity: number;
        unitPriceCents: number;
        totalPriceCents: number;
      }> = [];

      for (const item of dto.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { shop: true, variants: true },
        });

        if (!product) {
          throw new NotFoundException(`Produit ${item.productId} introuvable.`);
        }

        const isAvailable = product.isPublished && product.status === 'ACTIVE' && product.shop.status === 'PUBLISHED';
        if (!isAvailable) {
          throw new BadRequestException(`Le produit "${product.name}" n'est plus disponible.`);
        }

        if (shopId && shopId !== product.shopId) {
          throw new BadRequestException('Veuillez passer une commande par boutique afin de contacter le bon commerçant sur WhatsApp.');
        }
        const whatsapp = this.normalizeWhatsAppNumber(product.shop?.whatsapp);
        if (!whatsapp) {
          throw new BadRequestException(`La boutique ${product.shop?.name ?? ''} n'a pas configuré de numéro WhatsApp valide.`);
        }
        shopId = product.shopId;
        orderShop = { id: product.shopId, name: product.shop.name, whatsapp };

        const variant = item.productVariantId
          ? (product.variants.find((v: any) => v.id === item.productVariantId) ?? null)
          : null;

        if (item.productVariantId && !variant) {
          throw new BadRequestException('Variante de produit invalide.');
        }

        const availableStock = variant ? variant.stockQuantity : product.stockQuantity;
        if (item.quantity > availableStock) {
          throw new BadRequestException(`Stock insuffisant pour "${product.name}".`);
        }

        const unitPriceCents = variant?.priceCents ?? product.priceCents;
        const totalPriceCents = unitPriceCents * item.quantity;
        subtotalCents += totalPriceCents;
        normalizedItems.push({
          productId: product.id,
          productVariantId: variant?.id ?? null,
          name: product.name,
          quantity: item.quantity,
          unitPriceCents,
          totalPriceCents,
        });

        // Décrémenter le stock
        if (variant) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { stockQuantity: Math.max(0, variant.stockQuantity - item.quantity) },
          });
        } else {
          await tx.product.update({
            where: { id: product.id },
            data: { stockQuantity: Math.max(0, product.stockQuantity - item.quantity) },
          });
        }
      }

      const totalCents = subtotalCents;

      const order = await tx.order.create({
        data: {
          userId: null, // commande invité — pas de compte requis
          shopId,
          status: 'PENDING' as OrderStatus,
          subtotalCents,
          shippingCents: 0,
          discountCents: 0,
          totalCents,
          customerName: dto.customerName,
          customerEmail: dto.customerEmail ?? null,
          customerPhone: dto.customerPhone ?? null,
          deliveryAddress: dto.deliveryAddress ?? null,
          deliveryCity: dto.deliveryCity ?? null,
          deliveryCountry: dto.deliveryCountry ?? null,
          notes: dto.notes ?? null,
        },
      });

      await tx.orderItem.createMany({
        data: normalizedItems.map((item) => ({
          orderId: order.id,
          productId: item.productId,
          productVariantId: item.productVariantId,
          name: item.name,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          totalPriceCents: item.totalPriceCents,
        })),
      });

      // Notifier le commerçant
      if (shopId) {
        const shop = await tx.shop.findUnique({
          where: { id: shopId },
          select: { id: true, ownerId: true, name: true },
        });

        if (shop && this.notificationService.createNotification) {
          await this.notificationService.createNotification(shop.ownerId, {
            type: 'ORDER',
            title: 'Nouvelle commande reçue',
            message: `Commande de ${dto.customerName} — ${dto.items.length} article(s).`,
            relatedEntityType: 'ORDER',
            relatedEntityId: order.id,
          });
        }
      }

      return {
        ...order,
        reference: this.formatOrderReference(order.id),
        items: normalizedItems,
        subtotalCents,
        totalCents,
        whatsappUrl: `https://wa.me/${orderShop!.whatsapp.replace(/^\+/, '')}?text=${encodeURIComponent(this.buildWhatsAppMessage({
          ...order,
          shop: orderShop,
          items: normalizedItems,
          subtotalCents,
          totalCents,
        }))}`,
      };
    });
  }
}
