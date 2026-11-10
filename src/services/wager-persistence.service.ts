
import { Injectable, ConflictException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';

import {
  WagerTransaction,
  WagerTransactionStatus,
  WagerFailureCode,
} from '../entities/wager-transaction.js';

import { WalletLedgerEntry } from '../entities/wallet-ledger-entry.js';

import { WalletRepository } from '../infrastructure/database/repositories/wallet.repository.js';
import { WagerTransactionRepository } from '../infrastructure/database/repositories/wager-transaction.repository.js';
import { WalletLedgerEntryRepository } from '../infrastructure/database/repositories/wallet-ledger-entry.repository.js';

import { WagerProcessorService } from './wager-processor.service.js';

@Injectable()
export class WagerPersistenceService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly walletRepository: WalletRepository,
    private readonly transactionRepository: WagerTransactionRepository,
    private readonly ledgerRepository: WalletLedgerEntryRepository,
    private readonly processor: WagerProcessorService,
  ) {}

  async process(
    transaction: WagerTransaction,
    idempotencyKey: string,
    payloadHash: string,
  ): Promise<{
    transaction: WagerTransaction;
    ledgerEntry: WalletLedgerEntry | null;
  }> {
    try {
      return await this.entityManager.transactional(async (tx) => {
        const existingBeforeLock =
          await this.transactionRepository.findByIdempotencyKey(
            idempotencyKey,
            tx,
          );

        if (existingBeforeLock) {
          return this.resolveExisting(
            existingBeforeLock,
            payloadHash,
            tx,
          );
        }

        const wallet =
          await this.walletRepository.findByPlayerIdAndCurrency(
            transaction.playerId,
            transaction.amount.currency,
            tx,
            true,
          );

        if (!wallet) {
          throw new Error('Wallet not found');
        }

        if (wallet.id !== transaction.walletId) {
        throw new ConflictException(
          'Wallet does not belong to the transaction',
        );
}

        const existingAfterLock =
          await this.transactionRepository.findByIdempotencyKey(
            idempotencyKey,
            tx,
          );

        if (existingAfterLock) {
          return this.resolveExisting(
            existingAfterLock,
            payloadHash,
            tx,
          );
        }

        const providerId = transaction.providerId;
        const externalTransactionId =
          transaction.externalTransactionId;

        if (providerId && externalTransactionId) {
          const duplicateExternalId =
            await this.transactionRepository.findByProviderAndExternalId(
              providerId,
              externalTransactionId,
              tx,
            );

          if (duplicateExternalId) {
            throw new ConflictException(
              'External transaction ID already exists',
            );
          }
        }

        let reference: WagerTransaction | undefined;

        if (transaction.requiresReference()) {
          const referenceExternalId =
            transaction.referenceExternalTransactionId;

          if (!providerId || !referenceExternalId) {
            transaction.reject(
              WagerFailureCode.REFERENCE_NOT_FOUND,
            );
          } else {
            reference =
              (await this.transactionRepository.findByProviderAndExternalId(
                providerId,
                referenceExternalId,
                tx,
              )) ?? undefined;

            if (!reference) {
              transaction.reject(
                WagerFailureCode.REFERENCE_NOT_FOUND,
              );
            } else {
              const previousReversal =
                await this.transactionRepository
                  .findByReferenceTransactionIdAndKind(
                    reference.id,
                    transaction.kind,
                    tx,
                  );

              if (previousReversal) {
                transaction.reject(
                  WagerFailureCode.REFERENCE_ALREADY_REVERSED,
                );
              }
            }
          }
        }

        let ledgerEntry: WalletLedgerEntry | null = null;

        if (!transaction.isRejected()) {
          try {
            ledgerEntry = this.processor.process(
              transaction,
              wallet,
              reference,
            );
          } catch (error: unknown) {
            if (!transaction.isRejected()) {
              throw error;
            }
          }
        }

        if (ledgerEntry) {
          await this.walletRepository.save(wallet, tx);
          await this.ledgerRepository.save(ledgerEntry, tx);
        }

        await this.transactionRepository.save(
          transaction,
          idempotencyKey,
          payloadHash,
          tx,
        );

        await tx.flush();

        return {
          transaction,
          ledgerEntry,
        };
      });
    } catch (error: unknown) {
      const existing =
        await this.transactionRepository.findByIdempotencyKey(
          idempotencyKey,
        );

      if (existing) {
        return this.resolveExisting(existing, payloadHash);
      }

      throw error;
    }
  }

  private async resolveExisting(
    existing: {
      transaction: WagerTransaction;
      payloadHash: string;
    },
    payloadHash: string,
    em?: EntityManager,
  ): Promise<{
    transaction: WagerTransaction;
    ledgerEntry: WalletLedgerEntry | null;
  }> {
    if (existing.payloadHash !== payloadHash) {
      throw new ConflictException(
        'Idempotency key already used with a different payload',
      );
    }

    const previousLedger =
      await this.ledgerRepository.findByTransactionId(
        existing.transaction.id,
        em,
      );

    return {
      transaction: existing.transaction,
      ledgerEntry: previousLedger,
    };
  }
}
