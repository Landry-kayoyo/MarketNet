import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { ProductStatus } from '@prisma/client';

export class CreateProductDto {
  @IsString()
  @Length(2, 150)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(2, 150)
  slug?: string;

  @IsOptional()
  @IsString()
  @Length(2, 180)
  shortDescription?: string;

  @IsOptional()
  @IsString()
  @Length(10, 5000)
  description?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  priceCents!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  compareAtPriceCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  stockQuantity?: number;

  @IsOptional()
  @IsString()
  @Length(2, 120)
  sku?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}
