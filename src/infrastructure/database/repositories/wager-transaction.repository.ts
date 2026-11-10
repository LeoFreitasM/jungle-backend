
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';

import {
  WagerTransaction,
  WagerTransactionState,
  WagerTransactionStatus,
  WagerTransactionKind,
} from '../../../entities/wager-transaction.js';

import { WagerTransactionEntity } from '../entities/wager-transaction.entity.js';

@Injectable()
export class WagerTransactionRepository {
  constructor(
    private readonly entityManager: EntityManager,
  ) {}

  async save(
    transaction: WagerTransaction,
    idempotencyKey: string,
    payloadHash: string,
    em: EntityManager = this.entityManager,
  ): Promise<void> {
    const {
      providerId,
      externalTransactionId,
      roundId,
      gameId,
    } = transaction;

    if (
      !providerId ||
      !externalTransactionId ||
      !roundId ||
      !gameId
    ) {
      throw new Error(
        'Provider ID, external transaction ID, round ID and game ID are required',
      );
    }

    let entity = await em.findOne(WagerTransactionEntity, {
      id: transaction.id,
    });

    if (!entity) {
      entity = new WagerTransactionEntity();
    }

    entity.id = transaction.id;
    entity.idempotencyKey = idempotencyKey;
    entity.payloadHash = payloadHash;

    entity.providerId = providerId;
    entity.externalTransactionId = externalTransactionId;
    entity.roundId = roundId;
    entity.gameId = gameId;

    entity.referenceExternalTransactionId =
      transaction.referenceExternalTransactionId;

    entity.playerId = transaction.playerId;
    entity.walletId = transaction.walletId;

    entity.amount = transaction.amount.toJSON().amount;
    entity.currency = transaction.amount.toJSON().currency;

    entity.kind = transaction.kind;
    entity.status = transaction.status;

    entity.referenceTransactionId =
      transaction.referenceTransactionId;

    entity.failureCode = transaction.failureCode;
    entity.processedAt = transaction.processedAt;

    entity.balanceAfter = transaction.balanceAfter
      ? transaction.balanceAfter.toJSON().amount
      : null;

    entity.createdAt = transaction.createdAt;
    entity.updatedAt = transaction.updatedAt;

    em.persist(entity);
  }

  async findById(
    id: string,
    em: EntityManager = this.entityManager,
  ): Promise<WagerTransaction | null> {
    const entity = await em.findOne(
      WagerTransactionEntity,
      { id },
    );

    return entity ? this.toDomain(entity) : null;
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
    em: EntityManager = this.entityManager,
  ): Promise<{
    transaction: WagerTransaction;
    payloadHash: string;
  } | null> {
    const entity = await em.findOne(
      WagerTransactionEntity,
      { idempotencyKey },
    );

    if (!entity || !entity.payloadHash) {
      return null;
    }

    return {
      transaction: this.toDomain(entity),
      payloadHash: entity.payloadHash,
    };
  }

  async findByProviderAndExternalId(
    providerId: string,
    externalTransactionId: string,
    em: EntityManager = this.entityManager,
  ): Promise<WagerTransaction | null> {
    const entity = await em.findOne(
      WagerTransactionEntity,
      {
        providerId,
        externalTransactionId,
      },
    );

    return entity ? this.toDomain(entity) : null;
  }

  async findByReferenceTransactionIdAndKind(
    referenceTransactionId: string,
    kind: WagerTransactionKind,
    em: EntityManager = this.entityManager,
  ): Promise<WagerTransaction | null> {
    const entity = await em.findOne(
      WagerTransactionEntity,
      {
        referenceTransactionId,
        kind,
        status: WagerTransactionStatus.PROCESSED,
      },
    );

    return entity ? this.toDomain(entity) : null;
  }

  private toDomain(
    entity: WagerTransactionEntity,
  ): WagerTransaction {
    const state: WagerTransactionState = {
      id: entity.id,
      playerId: entity.playerId,
      walletId: entity.walletId,

      amount: {
        amount: entity.amount,
        currency: entity.currency,
      },

      kind: entity.kind,
      status: entity.status,

      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,

      providerId: entity.providerId,
      externalTransactionId: entity.externalTransactionId,
      idempotencyKey: entity.idempotencyKey,
      payloadHash: entity.payloadHash,

      roundId: entity.roundId,
      gameId: entity.gameId,

      referenceExternalTransactionId:
        entity.referenceExternalTransactionId,

      referenceTransactionId: entity.referenceTransactionId,
      failureCode: entity.failureCode,
      processedAt: entity.processedAt,

      balanceAfter: entity.balanceAfter
        ? {
            amount: entity.balanceAfter,
            currency: entity.currency,
          }
        : undefined,
    };

    return WagerTransaction.rehydrate(state);
  }
}
