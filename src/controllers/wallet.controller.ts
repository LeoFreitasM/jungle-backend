import { Body, Controller, Post } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { EntityManager } from '@mikro-orm/postgresql';

import { CreateWalletDto } from '../dtos/create-wallet.dto.js';
import { Wallet } from '../entities/wallet.js';
import { Money } from '../value-objects/money.js';
import { WalletRepository } from '../infrastructure/database/repositories/wallet.repository.js';

@Controller('wallets')
export class WalletController {
  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly entityManager: EntityManager,
  ) {}

  @Post()
  async create(@Body() dto: CreateWalletDto) {
    const wallet = Wallet.open({
      id: randomUUID(),
      playerId: dto.playerId,
      initialBalance: Money.from({
        amount: dto.initialBalance.amount,
        currency: dto.initialBalance.currency,
      }),
    });

    await this.entityManager.transactional(async (tx) => {
      await this.walletRepository.save(wallet, tx);
      await tx.flush();
    });

    return {
      id: wallet.id,
      playerId: wallet.playerId,
      balance: wallet.balance.toJSON(),
      version: wallet.version,
    };
  }
}