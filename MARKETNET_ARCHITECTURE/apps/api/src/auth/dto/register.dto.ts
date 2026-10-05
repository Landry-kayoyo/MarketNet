import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(8, 128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre.',
  })
  password!: string;

  @IsString()
  @Length(2, 120)
  fullName!: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
