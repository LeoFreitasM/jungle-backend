import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { WagerTransactionKind } from '../entities/wager-transaction.js';
import { MoneyDto } from './money.dto.js';

export class CreateWagerDto {
  @IsString()
  @IsNotEmpty()
  providerId: string;

  @IsString()
  @IsNotEmpty()
  externalTransactionId: string;

  @IsUUID()
  playerId: string;

  @IsUUID()
  walletId: string;

  @IsString()
  @IsNotEmpty()
  roundId: string;

  @IsString()
  @IsNotEmpty()
  gameId: string;

  @IsEnum(WagerTransactionKind)
  kind: WagerTransactionKind;

  @ValidateNested()
  @Type(() => MoneyDto)
  money: MoneyDto;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  referenceExternalTransactionId?: string;
}