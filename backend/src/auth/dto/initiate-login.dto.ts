import { IsEmail, IsNotEmpty } from 'class-validator';

export class InitiateLoginDto {
  @IsNotEmpty()
  @IsEmail({}, { message: 'A valid email address is required.' })
  email: string;
}
