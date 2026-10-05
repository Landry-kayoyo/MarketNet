import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateNotificationDto {
  @IsEnum(['ORDER', 'MESSAGE', 'REVIEW', 'SYSTEM'])
  type!: 'ORDER' | 'MESSAGE' | 'REVIEW' | 'SYSTEM';

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  relatedEntityType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  relatedEntityId?: string;
}
