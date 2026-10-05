import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';

import { ShopService } from '../src/shops/shop.service';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('ShopService', () => {
  let prisma: jest.Mocked<PrismaService>;
  let service: ShopService;

  beforeEach(() => {
    prisma = {
      shop: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    } as any;

    service = new ShopService(prisma);
  });

  it('creates a merchant shop with a generated slug and default draft status', async () => {
    (prisma.shop.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.shop.create as jest.Mock).mockResolvedValue({
      id: 'shop_1',
      ownerId: 'user_1',
      name: 'Boutique Élégance',
      slug: 'boutique-elegance',
      status: 'DRAFT',
      slogan: 'Votre style, votre élégance.',
      description: 'Mode, accessoires et élégance.',
      phone: '+243990000001',
      whatsapp: '+243990000001',
      email: 'shop@example.com',
      address: 'Lubumbashi',
      city: 'Lubumbashi',
      country: 'RDC',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.createShop('user_1', {
      name: 'Boutique Élégance',
      slogan: 'Votre style, votre élégance.',
      description: 'Mode, accessoires et élégance.',
      phone: '+243990000001',
      whatsapp: '+243990000001',
      email: 'shop@example.com',
      address: 'Lubumbashi',
      city: 'Lubumbashi',
      country: 'RDC',
    });

    expect(prisma.shop.create).toHaveBeenCalled();
    expect(result.slug).toBe('boutique-elegance');
    expect(result.status).toBe('DRAFT');
    expect(result.ownerId).toBe('user_1');
  });

  it('blocks a merchant from creating a second shop', async () => {
    (prisma.shop.findMany as jest.Mock).mockResolvedValue([{ id: 'existing_shop', ownerId: 'user_1' }]);

    await expect(
      service.createShop('user_1', { name: 'Deuxième boutique' }),
    ).rejects.toThrow(ConflictException);
  });

  it('forbids a merchant from updating another merchant shop', async () => {
    (prisma.shop.findUnique as jest.Mock).mockResolvedValue({
      id: 'shop_2',
      ownerId: 'user_2',
      name: 'Autre boutique',
      status: 'DRAFT',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      service.updateShop('user_1', 'shop_2', { name: 'Tentative d’attaque' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('returns only published shops in the public catalog', async () => {
    (prisma.shop.findMany as jest.Mock).mockResolvedValue([
      { id: 'p1', ownerId: 'u1', name: 'Boutique visible', status: 'PUBLISHED', slogan: 'Visible', description: 'Desc', city: 'Lubumbashi', country: 'RDC', createdAt: new Date(), updatedAt: new Date() },
      { id: 'p2', ownerId: 'u2', name: 'Boutique cachée', status: 'DRAFT', slogan: 'Cachée', description: 'Desc2', city: 'Lubumbashi', country: 'RDC', createdAt: new Date(), updatedAt: new Date() },
    ]);

    const result = await service.listPublicShops();

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('PUBLISHED');
  });

  it('throws a not found error when a shop does not exist', async () => {
    (prisma.shop.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.getShopByIdForUser('user_1', 'missing')).rejects.toThrow(NotFoundException);
  });
});
