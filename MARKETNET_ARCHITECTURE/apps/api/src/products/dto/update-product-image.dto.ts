import { IsBoolean, IsOptional, IsString, Length, MaxLength, MinLength } from 'class-validator';

export class UpdateProductImageDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(3_000_000)
  url?: string;

  @IsOptional()
  @IsString()
  @Length(2, 200)
  altText?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  sortOrder?: number;
}
