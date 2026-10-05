import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
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
import { ProductService } from './product.service';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Public()
  @Get()
  listPublicProducts() {
    return this.productService.listPublicProducts();
  }

  @Public()
  @Get('categories')
  listCategories() {
    return this.productService.listCategories();
  }

  @Public()
  @Get(':id')
  getProduct(@CurrentUser() user: any, @Param('id') id: string) {
    return this.productService.getProductByIdForUser(user ?? null, id);
  }

  @Get('shop/:shopId')
  @Roles('merchant', 'admin')
  @Permissions('products.manage.own')
  listShopProducts(@CurrentUser() user: any, @Param('shopId') shopId: string) {
    return this.productService.listProductsForShop(user, shopId);
  }

  @Post(['shop/:shopId', 'shops/:shopId'])
  @Roles('merchant', 'admin')
  @Permissions('products.manage.own')
  createProduct(@CurrentUser() user: any, @Param('shopId') shopId: string, @Body() dto: CreateProductDto) {
    return this.productService.createProduct(user, shopId, dto);
  }

  @Patch(':id')
  @Roles('merchant', 'admin')
  @Permissions('products.manage.own')
  updateProduct(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.updateProduct(user, id, dto);
  }

  @Patch(':id/archive')
  @Roles('merchant', 'admin')
  @Permissions('products.manage.own')
  archiveProduct(@CurrentUser() user: any, @Param('id') id: string) {
    return this.productService.archiveProduct(user, id);
  }

  @Delete(':id')
  @Roles('merchant', 'admin')
  @Permissions('products.manage.own')
  deleteProduct(@CurrentUser() user: any, @Param('id') id: string) {
    return this.productService.deleteProduct(user, id);
  }

  @Post('categories')
  @Roles('merchant', 'admin')
  @Permissions('products.manage.own')
  createCategory(@CurrentUser() user: any, @Body() dto: CreateCategoryDto) {
    return this.productService.createCategory(user, dto);
  }

  @Patch('categories/:id')
  @Roles('merchant', 'admin')
  @Permissions('products.manage.own')
  updateCategory(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.productService.updateCategory(user, id, dto);
  }

  @Post(':id/images')
  @Roles('merchant', 'admin')
  @Permissions('products.manage.own')
  createProductImage(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: CreateProductImageDto) {
    return this.productService.addImageToProduct(user, id, dto);
  }

  @Patch(':id/images/:imageId')
  @Roles('merchant', 'admin')
  @Permissions('products.manage.own')
  updateProductImage(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @Body() dto: UpdateProductImageDto,
  ) {
    return this.productService.updateImage(user, id, imageId, dto);
  }

  @Delete(':id/images/:imageId')
  @Roles('merchant', 'admin')
  @Permissions('products.manage.own')
  deleteProductImage(@CurrentUser() user: any, @Param('id') id: string, @Param('imageId') imageId: string) {
    return this.productService.deleteImage(user, id, imageId);
  }

  @Post(':id/variants')
  @Roles('merchant', 'admin')
  @Permissions('products.manage.own')
  createProductVariant(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: CreateProductVariantDto) {
    return this.productService.addVariant(user, id, dto);
  }

  @Patch(':id/variants/:variantId')
  @Roles('merchant', 'admin')
  @Permissions('products.manage.own')
  updateProductVariant(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateProductVariantDto,
  ) {
    return this.productService.updateVariant(user, id, variantId, dto);
  }

  @Delete(':id/variants/:variantId')
  @Roles('merchant', 'admin')
  @Permissions('products.manage.own')
  deleteProductVariant(@CurrentUser() user: any, @Param('id') id: string, @Param('variantId') variantId: string) {
    return this.productService.deleteVariant(user, id, variantId);
  }

  @Post(':id/specifications')
  @Roles('merchant', 'admin')
  @Permissions('products.manage.own')
  createProductSpecification(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: CreateProductSpecificationDto,
  ) {
    return this.productService.addSpecification(user, id, dto);
  }

  @Patch(':id/specifications/:specId')
  @Roles('merchant', 'admin')
  @Permissions('products.manage.own')
  updateProductSpecification(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('specId') specId: string,
    @Body() dto: UpdateProductSpecificationDto,
  ) {
    return this.productService.updateSpecification(user, id, specId, dto);
  }

  @Delete(':id/specifications/:specId')
  @Roles('merchant', 'admin')
  @Permissions('products.manage.own')
  deleteProductSpecification(@CurrentUser() user: any, @Param('id') id: string, @Param('specId') specId: string) {
    return this.productService.deleteSpecification(user, id, specId);
  }
}
