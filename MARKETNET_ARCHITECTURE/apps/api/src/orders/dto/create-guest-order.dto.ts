import { IsArray, IsEmail, IsInt, IsOptional, IsString, Length, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class GuestOrderItemDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @IsString()
  productVariantId?: string | null;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateGuestOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuestOrderItemDto)
  items!: GuestOrderItemDto[];

  @IsString()
  @Length(2, 120)
  customerName!: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string | null;

  @IsOptional()
  @IsString()
  customerPhone?: string | null;

  @IsOptional()
  @IsString()
  deliveryAddress?: string | null;

  @IsOptional()
  @IsString()
  deliveryCity?: string | null;

  @IsOptional()
  @IsString()
  deliveryCountry?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
