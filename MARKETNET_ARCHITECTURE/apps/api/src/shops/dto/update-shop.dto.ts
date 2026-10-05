import { IsEmail, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { ShopStatus } from '@prisma/client';

export class UpdateShopDto {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(2, 180)
  slogan?: string;

  @IsOptional()
  @IsString()
  @Length(10, 2000)
  description?: string;

  @IsOptional()
  @IsString()
  @Length(2, 80)
  phone?: string;

  @IsOptional()
  @IsString()
  @Length(2, 80)
  whatsapp?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(2, 200)
  address?: string;

  @IsOptional()
  @IsString()
  @Length(2, 80)
  city?: string;

  @IsOptional()
  @IsString()
  @Length(2, 80)
  country?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsEnum(ShopStatus)
  status?: ShopStatus;
}
