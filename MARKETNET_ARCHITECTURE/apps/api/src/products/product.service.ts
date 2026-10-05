import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductStatus } from '@prisma/client';

import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateProductImageDto } from './dto/create-product-image.dto';
import { CreateProductSpecificationDto } from './dto/create-product-specification.dto';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductImageDto } from './dto/update-product-image.dto';
import { UpdateProductSpecificationDto } from './dto/update-product-specification.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';

interface CurrentUserContext {
  id: string;
  roles?: string[];
  permissions?: string[];
}

@Injectable()
export class ProductService {
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
      .slice(0, 80) || 'produit';
  }

  private async generateUniqueSlug(shopId: string, baseName: string) {
    const existing = await this.prisma.product.findMany({
      where: { shopId },
      select: { slug: true },
    });

    const base = this.slugify(baseName);
    let slug = base;
    let counter = 1;

    while (existing.some((item) => item.slug === slug)) {
      slug = `${base}-${counter}`;
      counter += 1;
    }

    return slug;
  }

  private serializeProduct(product: any) {
    return {
      id: product.id,
      shopId: product.shopId,
      categoryId: product.categoryId ?? null,
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription ?? null,
      description: product.description ?? null,
      priceCents: product.priceCents,
      compareAtPriceCents: product.compareAtPriceCents ?? null,
      stockQuantity: product.stockQuantity,
      sku: product.sku ?? null,
      status: product.status,
      isPublished: product.isPublished,
      isFeatured: product.isFeatured,
      images: Array.isArray(product.images)
        ? product.images.map((image: any) => ({
            id: image.id,
            url: image.url,
            altText: image.altText ?? null,
            isPrimary: image.isPrimary,
            sortOrder: image.sortOrder,
          }))
        : [],
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  private async ensureShopOwnerAccess(user: string | CurrentUserContext | null, shopId: string) {
    const requester = this.normalizeUser(user);
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });

    if (!shop) {
      throw new NotFoundException('Shop not found.');
    }

    const canManage = shop.ownerId === requester.id || requester.roles?.includes('admin');
    if (!canManage) {
      throw new ForbiddenException('You are not allowed to manage products for this shop.');
    }

    return shop;
  }

  private async ensureProductOwnerAccess(user: string | CurrentUserContext | null, productId: string) {
    const requester = this.normalizeUser(user);
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { shop: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    const productShop = product.shop ?? (this.prisma.shop?.findUnique ? await this.prisma.shop.findUnique({ where: { id: product.shopId } }) : null);
    if (!productShop) {
      throw new ForbiddenException('You are not allowed to manage this product.');
    }

    const canManage = productShop.ownerId === requester.id || requester.roles?.includes('admin');
    if (!canManage) {
      throw new ForbiddenException('You are not allowed to manage this product.');
    }

    return { ...product, shop: productShop };
  }

  async listPublicProducts() {
    const products = await this.prisma.product.findMany({
      where: { isPublished: true, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });

    return products
      .filter((product) => product.isPublished && product.status === 'ACTIVE')
      .map((product) => this.serializeProduct(product));
  }

  async listProductsForShop(user: string | CurrentUserContext | null, shopId: string) {
    await this.ensureShopOwnerAccess(user, shopId);

    const products = await this.prisma.product.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });

    return products.map((product) => this.serializeProduct(product));
  }

  async getProductByIdForUser(user: string | CurrentUserContext | null, productId: string) {
    const requester = this.normalizeUser(user);
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { shop: true, images: { orderBy: { sortOrder: 'asc' } } },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    const isOwner = product.shop.ownerId === requester.id;
    const isAdmin = requester.roles?.includes('admin');
    const canViewPublic = product.isPublished && product.status === 'ACTIVE' && product.shop.status === 'PUBLISHED';

    if (isOwner || isAdmin || canViewPublic) {
      return this.serializeProduct(product);
    }

    throw new NotFoundException('Product not found.');
  }

  async createProduct(user: string | CurrentUserContext | null, shopId: string, dto: CreateProductDto) {
    await this.ensureShopOwnerAccess(user, shopId);

    const baseName = dto.name?.trim();
    if (!baseName) {
      throw new BadRequestException('Product name is required.');
    }

    if (dto.priceCents === undefined || dto.priceCents < 0) {
      throw new BadRequestException('Product price must be a valid positive integer in cents.');
    }

    if (dto.stockQuantity === undefined || dto.stockQuantity < 0) {
      throw new BadRequestException('Stock quantity must be zero or greater.');
    }

    const slug = dto.slug?.trim() ? this.slugify(dto.slug) : await this.generateUniqueSlug(shopId, baseName);
    const existingProducts = await this.prisma.product.findMany({
      where: { shopId, slug },
    });
    const existing = existingProducts[0];

    if (existing) {
      throw new ConflictException('A product with this slug already exists in the shop.');
    }

    const created = await this.prisma.product.create({
      data: {
        shopId,
        categoryId: dto.categoryId ?? null,
        name: baseName,
        slug,
        shortDescription: dto.shortDescription?.trim() || null,
        description: dto.description?.trim() || null,
        priceCents: dto.priceCents,
        compareAtPriceCents: dto.compareAtPriceCents ?? null,
        stockQuantity: dto.stockQuantity,
        sku: dto.sku?.trim() || null,
        status: dto.status ?? ('DRAFT' as ProductStatus),
        isPublished: dto.isPublished ?? false,
        isFeatured: dto.isFeatured ?? false,
      },
    });

    return this.serializeProduct(created);
  }

  async updateProduct(user: string | CurrentUserContext | null, productId: string, dto: UpdateProductDto) {
    const product = await this.ensureProductOwnerAccess(user, productId);

    const data: Record<string, any> = {};

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new BadRequestException('Product name cannot be empty.');
      }
      data.name = name;
    }

    if (dto.slug !== undefined) {
      const slug = this.slugify(dto.slug);
      const existingProducts = await this.prisma.product.findMany({
        where: { shopId: product.shopId, slug },
      });
      const existing = existingProducts.find((item) => item.id !== productId);

      if (existing) {
        throw new ConflictException('A product with this slug already exists in the shop.');
      }

      data.slug = slug;
    }

    if (dto.shortDescription !== undefined) data.shortDescription = dto.shortDescription.trim() || null;
    if (dto.description !== undefined) data.description = dto.description.trim() || null;
    if (dto.categoryId !== undefined) data.categoryId = dto.categoryId || null;
    if (dto.priceCents !== undefined) {
      if (dto.priceCents < 0) {
        throw new BadRequestException('Price must be zero or greater.');
      }
      data.priceCents = dto.priceCents;
    }
    if (dto.compareAtPriceCents !== undefined) data.compareAtPriceCents = dto.compareAtPriceCents ?? null;
    if (dto.stockQuantity !== undefined) {
      if (dto.stockQuantity < 0) {
        throw new BadRequestException('Stock quantity must be zero or greater.');
      }
      data.stockQuantity = dto.stockQuantity;
    }
    if (dto.sku !== undefined) data.sku = dto.sku.trim() || null;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.isPublished !== undefined) data.isPublished = dto.isPublished;
    if (dto.isFeatured !== undefined) data.isFeatured = dto.isFeatured;

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data,
    });

    return this.serializeProduct(updated);
  }

  async archiveProduct(user: string | CurrentUserContext | null, productId: string) {
    const product = await this.ensureProductOwnerAccess(user, productId);

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: {
        status: 'ARCHIVED' as ProductStatus,
        isPublished: false,
      },
    });

    return this.serializeProduct(updated);
  }

  async deleteProduct(user: string | CurrentUserContext | null, productId: string) {
    return this.archiveProduct(user, productId);
  }

  async listCategories() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return categories;
  }

  async createCategory(user: string | CurrentUserContext | null, dto: CreateCategoryDto) {
    const requester = this.normalizeUser(user);
    const isAdmin = requester.roles?.includes('admin');
    const isMerchant = requester.roles?.includes('merchant');

    if (!isAdmin && !isMerchant) {
      throw new ForbiddenException('You are not allowed to create categories.');
    }

    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('Category name is required.');
    }

    const slug = dto.slug?.trim() ? this.slugify(dto.slug) : this.slugify(name);
    const existing = await this.prisma.category.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException('A category with this slug already exists.');
    }

    return this.prisma.category.create({
      data: {
        name,
        slug,
        description: dto.description?.trim() || null,
        parentId: dto.parentId || null,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateCategory(user: string | CurrentUserContext | null, categoryId: string, dto: UpdateCategoryDto) {
    const requester = this.normalizeUser(user);
    const isAdmin = requester.roles?.includes('admin');
    const isMerchant = requester.roles?.includes('merchant');

    if (!isAdmin && !isMerchant) {
      throw new ForbiddenException('You are not allowed to update categories.');
    }

    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    const data: Record<string, any> = {};

    if (dto.name !== undefined) {
      const nextName = dto.name.trim();
      if (!nextName) {
        throw new BadRequestException('Category name cannot be empty.');
      }
      data.name = nextName;
    }

    if (dto.slug !== undefined) {
      const slug = this.slugify(dto.slug);
      const existing = await this.prisma.category.findUnique({ where: { slug } });
      if (existing && existing.id !== categoryId) {
        throw new ConflictException('A category with this slug already exists.');
      }
      data.slug = slug;
    }

    if (dto.description !== undefined) data.description = dto.description.trim() || null;
    if (dto.parentId !== undefined) data.parentId = dto.parentId || null;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.category.update({
      where: { id: categoryId },
      data,
    });
  }

  async addImageToProduct(user: string | CurrentUserContext | null, productId: string, dto: CreateProductImageDto) {
    await this.ensureProductOwnerAccess(user, productId);

    return this.prisma.productImage.create({
      data: {
        productId,
        url: dto.url.trim(),
        altText: dto.altText?.trim() || null,
        isPrimary: dto.isPrimary ?? false,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updateImage(user: string | CurrentUserContext | null, productId: string, imageId: string, dto: UpdateProductImageDto) {
    await this.ensureProductOwnerAccess(user, productId);

    const image = await this.prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image || image.productId !== productId) {
      throw new NotFoundException('Product image not found.');
    }

    const data: Record<string, any> = {};
    if (dto.url !== undefined) data.url = dto.url.trim();
    if (dto.altText !== undefined) data.altText = dto.altText.trim() || null;
    if (dto.isPrimary !== undefined) data.isPrimary = dto.isPrimary;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;

    return this.prisma.productImage.update({
      where: { id: imageId },
      data,
    });
  }

  async deleteImage(user: string | CurrentUserContext | null, productId: string, imageId: string) {
    await this.ensureProductOwnerAccess(user, productId);

    const image = await this.prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image || image.productId !== productId) {
      throw new NotFoundException('Product image not found.');
    }

    await this.prisma.productImage.delete({ where: { id: imageId } });
    return { success: true, imageId };
  }

  async addVariant(user: string | CurrentUserContext | null, productId: string, dto: CreateProductVariantDto) {
    await this.ensureProductOwnerAccess(user, productId);

    return this.prisma.productVariant.create({
      data: {
        productId,
        name: dto.name.trim(),
        value: dto.value.trim(),
        sku: dto.sku?.trim() || null,
        priceCents: dto.priceCents ?? null,
        stockQuantity: dto.stockQuantity ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateVariant(
    user: string | CurrentUserContext | null,
    productId: string,
    variantId: string,
    dto: UpdateProductVariantDto,
  ) {
    await this.ensureProductOwnerAccess(user, productId);

    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant || variant.productId !== productId) {
      throw new NotFoundException('Product variant not found.');
    }

    const data: Record<string, any> = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.value !== undefined) data.value = dto.value.trim();
    if (dto.sku !== undefined) data.sku = dto.sku.trim() || null;
    if (dto.priceCents !== undefined) data.priceCents = dto.priceCents ?? null;
    if (dto.stockQuantity !== undefined) data.stockQuantity = dto.stockQuantity;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.productVariant.update({
      where: { id: variantId },
      data,
    });
  }

  async deleteVariant(user: string | CurrentUserContext | null, productId: string, variantId: string) {
    await this.ensureProductOwnerAccess(user, productId);

    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant || variant.productId !== productId) {
      throw new NotFoundException('Product variant not found.');
    }

    await this.prisma.productVariant.delete({ where: { id: variantId } });
    return { success: true, variantId };
  }

  async addSpecification(
    user: string | CurrentUserContext | null,
    productId: string,
    dto: CreateProductSpecificationDto,
  ) {
    await this.ensureProductOwnerAccess(user, productId);

    return this.prisma.productSpecification.create({
      data: {
        productId,
        name: dto.name.trim(),
        value: dto.value.trim(),
      },
    });
  }

  async updateSpecification(
    user: string | CurrentUserContext | null,
    productId: string,
    specId: string,
    dto: UpdateProductSpecificationDto,
  ) {
    await this.ensureProductOwnerAccess(user, productId);

    const specification = await this.prisma.productSpecification.findUnique({ where: { id: specId } });
    if (!specification || specification.productId !== productId) {
      throw new NotFoundException('Product specification not found.');
    }

    const data: Record<string, any> = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.value !== undefined) data.value = dto.value.trim();

    return this.prisma.productSpecification.update({
      where: { id: specId },
      data,
    });
  }

  async deleteSpecification(user: string | CurrentUserContext | null, productId: string, specId: string) {
    await this.ensureProductOwnerAccess(user, productId);

    const specification = await this.prisma.productSpecification.findUnique({ where: { id: specId } });
    if (!specification || specification.productId !== productId) {
      throw new NotFoundException('Product specification not found.');
    }

    await this.prisma.productSpecification.delete({ where: { id: specId } });
    return { success: true, specificationId: specId };
  }
}
