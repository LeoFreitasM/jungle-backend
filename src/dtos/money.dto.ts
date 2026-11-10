import { IsString, Matches } from 'class-validator';

export class MoneyDto {
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  amount: string;

  @IsString()
  @Matches(/^[A-Za-z]{3}$/)
  currency: string;
}