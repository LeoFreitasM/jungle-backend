
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';

import { WalletLedgerEntry } from '../../../entities/wallet-ledger-entry.js';
import { WalletLedgerEntryEntity } from '../entities/wallet-ledger-entry.entity.js';

@Injectable()
export class WalletLedgerEntryRepository {
  constructor(
    private readonly entityManager: EntityManager,
  ) {}

  async save(
    entry: WalletLedgerEntry,
    em: EntityManager = this.entityManager,
  ): Promise<void> {
    const entity = new WalletLedgerEntryEntity();

    entity.id = entry.id;
    entity.walletId = entry.walletId;
    entity.transactionId = entry.transactionId;
    entity.direction = entry.direction;
    entity.amount = entry.money.toJSON().amount;
    entity.currency = entry.money.toJSON().currency;
    entity.balanceBefore = entry.balanceBefore.toJSON().amount;
    entity.balanceAfter = entry.balanceAfter.toJSON().amount;
    entity.createdAt = entry.createdAt;

    em.persist(entity);
  }

  async findByTransactionId(
    transactionId: string,
    em: EntityManager = this.entityManager,
  ): Promise<WalletLedgerEntry | null> {
    const entity = await em.findOne(
      WalletLedgerEntryEntity,
      { transactionId },
    );

    if (!entity) {
      return null;
    }

    return WalletLedgerEntry.rehydrate({
      id: entity.id,
      walletId: entity.walletId,
      transactionId: entity.transactionId,
      direction: entity.direction,
      money: {
        amount: entity.amount,
        currency: entity.currency,
      },
      balanceBefore: {
        amount: entity.balanceBefore,
        currency: entity.currency,
      },
      balanceAfter: {
        amount: entity.balanceAfter,
        currency: entity.currency,
      },
      createdAt: entity.createdAt,
    });
  }
}
