import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AddCartItemDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @IsString()
  productVariantId?: string | null;

  @IsInt()
  @Min(1)
  quantity!: number;
}
