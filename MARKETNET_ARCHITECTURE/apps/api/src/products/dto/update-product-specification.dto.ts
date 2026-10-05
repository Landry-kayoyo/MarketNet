import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateProductSpecificationDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(2, 300)
  value?: string;
}
