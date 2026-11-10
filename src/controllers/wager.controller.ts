
import {
  Body,
  Controller,
  Headers,
  Post,
  BadRequestException,
} from '@nestjs/common';

import { randomUUID, createHash } from 'node:crypto';

import { CreateWagerDto } from '../dtos/create-wager.dto.js';
import { WagerTransaction } from '../entities/wager-transaction.js';
import { Money } from '../value-objects/money.js';
import { WagerPersistenceService } from '../services/wager-persistence.service.js';

@Controller('wagering/transactions')
export class WagerController {
  constructor(
    private readonly wagerPersistenceService: WagerPersistenceService,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateWagerDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const normalizedIdempotencyKey = idempotencyKey?.trim();

    if (!normalizedIdempotencyKey) {
      throw new BadRequestException(
        'Idempotency-Key header is required',
      );
    }

    const money = Money.from({
      amount: dto.money.amount,
      currency: dto.money.currency.toUpperCase(),
    });

    const payload = {
      providerId: dto.providerId,
      externalTransactionId: dto.externalTransactionId,
      playerId: dto.playerId,
      walletId: dto.walletId,
      roundId: dto.roundId,
      gameId: dto.gameId,
      kind: dto.kind,
      money: money.toJSON(),
      referenceExternalTransactionId:
        dto.referenceExternalTransactionId ?? null,
    };

    const payloadHash = createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');

    const transaction = WagerTransaction.create({
      id: randomUUID(),
      providerId: dto.providerId,
      externalTransactionId: dto.externalTransactionId,
      playerId: dto.playerId,
      walletId: dto.walletId,
      roundId: dto.roundId,
      gameId: dto.gameId,
      amount: money,
      kind: dto.kind,
      referenceExternalTransactionId:
        dto.referenceExternalTransactionId,
    });

    const result = await this.wagerPersistenceService.process(
      transaction,
      normalizedIdempotencyKey,
      payloadHash,
    );

    return {
      transactionId: result.transaction.id,
      status: result.transaction.status,
      balance: result.transaction.balanceAfter?.toJSON() ?? null,
      failureCode: result.transaction.failureCode ?? null,
    };
  }
}
