import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  subject?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  shopId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  orderId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  receiverId!: string;
}
