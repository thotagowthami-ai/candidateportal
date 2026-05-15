import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class InitiateRegistrationDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  middleName?: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^[0-9]{10}$/, {
    message: 'Phone number must be 10 digits',
  })
  phone: string;
}
