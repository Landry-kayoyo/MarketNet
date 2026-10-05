import { IsEmail, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateOrderDto {
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
