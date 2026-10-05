import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class CreateProductImageDto {
  @IsString()
  @Length(1, 500)
  url!: string;

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
