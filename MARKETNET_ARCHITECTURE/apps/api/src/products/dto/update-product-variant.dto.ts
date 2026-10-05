import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class UpdateProductVariantDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  value?: string;

  @IsOptional()
  @IsString()
  @Length(2, 120)
  sku?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  priceCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  stockQuantity?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
