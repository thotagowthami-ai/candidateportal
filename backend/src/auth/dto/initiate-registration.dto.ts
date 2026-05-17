import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class InitiateRegistrationDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsOptional()
  middleName?: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'Phone number must be in E.164 format (e.g. +14155552671)',
  })
  phone: string;
}
