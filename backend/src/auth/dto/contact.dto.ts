import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class ContactDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'Phone number must be in E.164 format (e.g. +14155552671)',
  })
  phone?: string;
}
