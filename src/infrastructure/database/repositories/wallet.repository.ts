
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { LockMode } from '@mikro-orm/core';

import { Wallet } from '../../../entities/wallet.js';
import { WalletEntity } from '../entities/wallet.entities.js';

@Injectable()
export class WalletRepository {
  constructor(
    private readonly entityManager: EntityManager,
  ) {}

  async findByPlayerIdAndCurrency(
    playerId: string,
    currency: string,
    em: EntityManager = this.entityManager,
    lock = false,
  ): Promise<Wallet | null> {
    const entity = await em.findOne(
      WalletEntity,
      {
        playerId,
        currency,
      },
      lock
        ? { lockMode: LockMode.PESSIMISTIC_WRITE }
        : {},
    );

    if (!entity) {
      return null;
    }

    return Wallet.rehydrate({
      id: entity.id,
      playerId: entity.playerId,
      currency: entity.currency,
      balance: entity.balance,
      version: entity.version,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  async findById(
    id: string,
    em: EntityManager = this.entityManager,
    lock = false,
  ): Promise<Wallet | null> {
    const entity = await em.findOne(
      WalletEntity,
      { id },
      lock
        ? { lockMode: LockMode.PESSIMISTIC_WRITE }
        : {},
    );

    if (!entity) {
      return null;
    }

    return Wallet.rehydrate({
      id: entity.id,
      playerId: entity.playerId,
      currency: entity.currency,
      balance: entity.balance,
      version: entity.version,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  async save(
    wallet: Wallet,
    em: EntityManager = this.entityManager,
  ): Promise<void> {
    let entity = await em.findOne(WalletEntity, {
      id: wallet.id,
    });

    if (!entity) {
      entity = new WalletEntity();
    }

    entity.id = wallet.id;
    entity.playerId = wallet.playerId;
    entity.currency = wallet.currency;
    entity.balance = wallet.balance.toJSON().amount;
    entity.version = wallet.version;
    entity.createdAt = wallet.createdAt;
    entity.updatedAt = wallet.updatedAt;

    em.persist(entity);
  }
}
