import { IsNotEmpty, IsString } from 'class-validator';

export class ExchangeDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}
