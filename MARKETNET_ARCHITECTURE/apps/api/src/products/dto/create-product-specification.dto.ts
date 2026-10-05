import { IsString, Length } from 'class-validator';

export class CreateProductSpecificationDto {
  @IsString()
  @Length(2, 100)
  name!: string;

  @IsString()
  @Length(2, 300)
  value!: string;
}
