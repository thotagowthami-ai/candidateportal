import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  firstName: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  middleName?: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  lastName: string;

  @IsEmail()
  @Transform(({ value }) => value.trim().toLowerCase())
  email: string;

  @IsString()
  @Transform(({ value }) => value.replace(/\D/g, ''))
  @Matches(/^\d{10,15}$/, {
    message: 'Phone number must be 10-15 digits',
  })
  phone: string;
}
