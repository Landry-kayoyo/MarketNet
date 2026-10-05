import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ShopStatus } from '@prisma/client';

import { PrismaService } from '../common/prisma/prisma.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';

interface CurrentUserContext {
  id: string;
  roles?: string[];
  permissions?: string[];
}

@Injectable()
export class ShopService {
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

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'boutique';
  }

  private async generateUniqueSlug(baseName: string) {
    const existingShops = await this.prisma.shop.findMany({ select: { slug: true } });
    const base = this.slugify(baseName);
    let slug = base;
    let counter = 1;

    while (existingShops.some((shop) => shop.slug === slug)) {
      slug = `${base}-${counter}`;
      counter += 1;
    }

    return slug;
  }

  private serializeShop(shop: any) {
    return {
      id: shop.id,
      ownerId: shop.ownerId,
      name: shop.name,
      slug: shop.slug,
      slogan: shop.slogan ?? null,
      description: shop.description ?? null,
      phone: shop.phone ?? null,
      whatsapp: shop.whatsapp ?? null,
      email: shop.email ?? null,
      address: shop.address ?? null,
      city: shop.city ?? null,
      country: shop.country ?? null,
      logoUrl: shop.logoUrl ?? null,
      coverUrl: shop.coverUrl ?? null,
      status: shop.status,
      createdAt: shop.createdAt,
      updatedAt: shop.updatedAt,
    };
  }

  private serializePublicShop(shop: any) {
    return {
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      slogan: shop.slogan ?? null,
      description: shop.description ?? null,
      phone: shop.phone ?? null,
      whatsapp: shop.whatsapp ?? null,
      email: shop.email ?? null,
      address: shop.address ?? null,
      city: shop.city ?? null,
      country: shop.country ?? null,
      logoUrl: shop.logoUrl ?? null,
      coverUrl: shop.coverUrl ?? null,
      status: shop.status,
    };
  }

  async listPublicShops() {
    const shops = await this.prisma.shop.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
    });

    return shops
      .filter((shop) => shop.status === 'PUBLISHED')
      .map((shop) => this.serializePublicShop(shop));
  }

  async getOwnedShops(userId: string) {
    const shops = await this.prisma.shop.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    });

    return shops.map((shop) => this.serializeShop(shop));
  }

  async createShop(userId: string, dto: CreateShopDto) {
    const existingShops = await this.prisma.shop.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });

    if (existingShops.length > 0) {
      throw new ConflictException('This merchant already owns a shop.');
    }

    const slug = dto.slug?.trim() ? this.slugify(dto.slug) : await this.generateUniqueSlug(dto.name);
    const created = await this.prisma.shop.create({
      data: {
        ownerId: userId,
        name: dto.name.trim(),
        slug,
        slogan: dto.slogan?.trim() ?? null,
        description: dto.description?.trim() ?? null,
        phone: dto.phone?.trim() || null,
        whatsapp: dto.whatsapp?.trim() || null,
        email: dto.email?.trim().toLowerCase() || null,
        address: dto.address?.trim() || null,
        city: dto.city?.trim() || null,
        country: dto.country?.trim() || null,
        logoUrl: dto.logoUrl?.trim() || null,
        coverUrl: dto.coverUrl?.trim() || null,
        status: dto.status ?? ('DRAFT' as ShopStatus),
      },
    });

    return this.serializeShop(created);
  }

  async getShopByIdForUser(user: string | CurrentUserContext | null, shopId: string) {
    const requester = this.normalizeUser(user);
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });

    if (!shop) {
      throw new NotFoundException('Shop not found.');
    }

    const isOwner = shop.ownerId === requester.id;
    const isAdmin = requester.roles?.includes('admin');

    if (isOwner || isAdmin) {
      return this.serializeShop(shop);
    }

    if (shop.status === 'PUBLISHED') {
      return this.serializePublicShop(shop);
    }

    throw new NotFoundException('Shop not found.');
  }

  async updateShop(user: string | CurrentUserContext, shopId: string, dto: UpdateShopDto) {
    const requester = this.normalizeUser(user);
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });

    if (!shop) {
      throw new NotFoundException('Shop not found.');
    }

    const canManage = shop.ownerId === requester.id || requester.roles?.includes('admin');
    if (!canManage) {
      throw new ForbiddenException('You are not allowed to update this shop.');
    }

    const updated = await this.prisma.shop.update({
      where: { id: shopId },
      data: {
        name: dto.name?.trim() ?? undefined,
        slogan: dto.slogan !== undefined ? dto.slogan.trim() || null : undefined,
        description: dto.description !== undefined ? dto.description.trim() || null : undefined,
        phone: dto.phone !== undefined ? dto.phone.trim() || null : undefined,
        whatsapp: dto.whatsapp !== undefined ? dto.whatsapp.trim() || null : undefined,
        email: dto.email !== undefined ? dto.email.trim().toLowerCase() || null : undefined,
        address: dto.address !== undefined ? dto.address.trim() || null : undefined,
        city: dto.city !== undefined ? dto.city.trim() || null : undefined,
        country: dto.country !== undefined ? dto.country.trim() || null : undefined,
        logoUrl: dto.logoUrl !== undefined ? dto.logoUrl.trim() || null : undefined,
        coverUrl: dto.coverUrl !== undefined ? dto.coverUrl.trim() || null : undefined,
        status: dto.status ?? undefined,
      },
    });

    return this.serializeShop(updated);
  }

  async updateStatus(user: string | CurrentUserContext, shopId: string, status: ShopStatus) {
    const requester = this.normalizeUser(user);
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });

    if (!shop) {
      throw new NotFoundException('Shop not found.');
    }

    const canManage = shop.ownerId === requester.id || requester.roles?.includes('admin');
    if (!canManage) {
      throw new ForbiddenException('You are not allowed to change this shop status.');
    }

    const updated = await this.prisma.shop.update({
      where: { id: shopId },
      data: { status },
    });

    return this.serializeShop(updated);
  }
}
