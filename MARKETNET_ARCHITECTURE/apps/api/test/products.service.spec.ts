import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { ProductService } from '../src/products/product.service';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('ProductService', () => {
  let prisma: jest.Mocked<PrismaService>;
  let service: ProductService;

  beforeEach(() => {
    prisma = {
      shop: { findUnique: jest.fn().mockResolvedValue({ id: 'shop_1', ownerId: 'user_1', status: 'PUBLISHED' }) },
      product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      category: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      productImage: { create: jest.fn(), findMany: jest.fn(), update: jest.fn(), deleteMany: jest.fn() },
      productVariant: { create: jest.fn(), findMany: jest.fn(), update: jest.fn(), delete: jest.fn() },
      productSpecification: { create: jest.fn(), findMany: jest.fn(), update: jest.fn(), delete: jest.fn() },
    } as any;

    service = new ProductService(prisma);
  });

  it('creates a product for a merchant-owned shop with default draft state', async () => {
    (prisma.shop.findUnique as jest.Mock).mockResolvedValue({ id: 'shop_1', ownerId: 'user_1', status: 'PUBLISHED' });
    (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.product.create as jest.Mock).mockResolvedValue({
      id: 'product_1',
      shopId: 'shop_1',
      categoryId: null,
      name: 'Tee-shirt Premium',
      slug: 'tee-shirt-premium',
      shortDescription: 'T-shirt premium',
      description: 'Très bon produit',
      priceCents: 25000,
      compareAtPriceCents: null,
      stockQuantity: 25,
      sku: 'TSH-001',
      status: 'DRAFT',
      isPublished: false,
      isFeatured: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.createProduct('user_1', 'shop_1', {
      name: 'Tee-shirt Premium',
      shortDescription: 'T-shirt premium',
      description: 'Très bon produit',
      priceCents: 25000,
      stockQuantity: 25,
      sku: 'TSH-001',
    });

    expect(prisma.product.create).toHaveBeenCalled();
    expect(result.slug).toBe('tee-shirt-premium');
    expect(result.status).toBe('DRAFT');
    expect(result.shopId).toBe('shop_1');
  });

  it('blocks a merchant from creating a product in another shop', async () => {
    (prisma.shop.findUnique as jest.Mock).mockResolvedValue({ id: 'shop_2', ownerId: 'user_2', status: 'PUBLISHED' });

    await expect(
      service.createProduct('user_1', 'shop_2', { name: 'Produit interdit', priceCents: 1200, stockQuantity: 10 }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('returns only published products in the public catalog', async () => {
    (prisma.product.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'p1',
        shopId: 'shop_1',
        categoryId: null,
        name: 'Produit actif',
        slug: 'produit-actif',
        shortDescription: 'Actif',
        description: 'Description',
        priceCents: 25000,
        compareAtPriceCents: null,
        stockQuantity: 12,
        sku: 'P-1',
        status: 'ACTIVE',
        isPublished: true,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'p2',
        shopId: 'shop_2',
        categoryId: null,
        name: 'Produit caché',
        slug: 'produit-cache',
        shortDescription: 'Masqué',
        description: 'Description',
        priceCents: 8000,
        compareAtPriceCents: null,
        stockQuantity: 3,
        sku: 'P-2',
        status: 'DRAFT',
        isPublished: false,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await service.listPublicProducts();

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('ACTIVE');
    expect(result[0].isPublished).toBe(true);
  });

  it('forbids updating a product that belongs to another shop', async () => {
    (prisma.shop.findUnique as jest.Mock).mockResolvedValue({ id: 'shop_3', ownerId: 'user_2', status: 'PUBLISHED' });
    (prisma.product.findUnique as jest.Mock).mockResolvedValue({
      id: 'product_3',
      shopId: 'shop_3',
      ownerId: 'user_2',
      name: 'Produit de l’autre',
      slug: 'autre-produit',
      status: 'ACTIVE',
      isPublished: true,
      priceCents: 15000,
      stockQuantity: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      service.updateProduct('user_1', 'product_3', { name: 'Tentative' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('archives a product instead of hard deleting it', async () => {
    (prisma.shop.findUnique as jest.Mock).mockResolvedValue({ id: 'shop_1', ownerId: 'user_1', status: 'PUBLISHED' });
    (prisma.product.findUnique as jest.Mock).mockResolvedValue({
      id: 'product_4',
      shopId: 'shop_1',
      name: 'Produit a archiver',
      slug: 'produit-a-archiver',
      status: 'ACTIVE',
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    (prisma.product.update as jest.Mock).mockResolvedValue({
      ...{ id: 'product_4', shopId: 'shop_1', status: 'ARCHIVED', isPublished: false },
    });

    const result = await service.archiveProduct('user_1', 'product_4');

    expect(prisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'product_4' },
        data: expect.objectContaining({ status: 'ARCHIVED', isPublished: false }),
      }),
    );
    expect(result.status).toBe('ARCHIVED');
  });
});
