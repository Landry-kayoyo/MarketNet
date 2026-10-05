import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateCartItemDto {
  @IsOptional()
  @IsString()
  productVariantId?: string | null;

  @IsInt()
  @Min(1)
  quantity!: number;
}
