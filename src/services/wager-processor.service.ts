import { Injectable } from '@nestjs/common';

import { Wallet } from '../entities/wallet.js';
import {
  WagerTransaction,
  WagerTransactionKind,
  WagerFailureCode,
  WagerTransactionStatus,
} from '../entities/wager-transaction.js';
import { WalletLedgerEntry } from '../entities/wallet-ledger-entry.js';

@Injectable()
export class WagerProcessorService {
  process(
    transaction: WagerTransaction,
    wallet: Wallet,
    reference?: WagerTransaction,
  ): WalletLedgerEntry | null {
    if (
      transaction.walletId !== wallet.id ||
      transaction.playerId !== wallet.playerId
    ) {
      return this.reject(
        transaction,
        WagerFailureCode.INVALID_WALLET,
        'Transaction does not belong to this wallet or player',
      );
    }

    if (transaction.amount.currency !== wallet.currency) {
      return this.reject(
        transaction,
        WagerFailureCode.INVALID_CURRENCY,
        'Transaction currency does not match wallet currency',
      );
    }

    try {
      let ledgerEntry: WalletLedgerEntry | null = null;

      switch (transaction.kind) {
        case WagerTransactionKind.BET:
          ledgerEntry = wallet.debit(
            transaction.amount,
            transaction.id,
          );
          break;

        case WagerTransactionKind.WIN:
          ledgerEntry = wallet.credit(
            transaction.amount,
            transaction.id,
          );
          break;

        case WagerTransactionKind.LOSS:
          if (!transaction.amount.isZero()) {
            throw new Error('LOSS transaction amount must be zero');
          }
          break;

        case WagerTransactionKind.REFUND:
          this.validateReference(transaction, wallet, reference);

          if (reference?.kind !== WagerTransactionKind.BET) {
            throw new Error('REFUND must reference a processed BET');
          }

          ledgerEntry = wallet.credit(
            transaction.amount,
            transaction.id,
          );
          break;

        case WagerTransactionKind.ROLLBACK:
          this.validateReference(transaction, wallet, reference);

          if (
            !reference ||
            ![
              WagerTransactionKind.BET,
              WagerTransactionKind.WIN,
              WagerTransactionKind.REFUND,
            ].includes(reference.kind)
          ) {
            throw new Error('ROLLBACK reference type is invalid');
          }

          if (reference.kind === WagerTransactionKind.BET) {
            ledgerEntry = wallet.credit(
              transaction.amount,
              transaction.id,
            );
          } else {
            // WIN e REFUND são créditos; o rollback desfaz o crédito.
            ledgerEntry = wallet.debit(
              transaction.amount,
              transaction.id,
            );
          }
          break;

        default:
          throw new Error('Unsupported transaction kind');
      }

      transaction.markProcessed(
        reference?.id,
        wallet.balance,
      );

      return ledgerEntry;
    } catch (error) {
      if (!transaction.isTerminal()) {
        const code =
          error instanceof Error &&
          error.message === 'Insufficient balance'
            ? transaction.kind === WagerTransactionKind.ROLLBACK
              ? WagerFailureCode.REVERSAL_INSUFFICIENT_FUNDS
              : WagerFailureCode.INSUFFICIENT_FUNDS
            : WagerFailureCode.BUSINESS_RULE_VIOLATION;

        transaction.reject(code);
      }

      throw error;
    }
  }

  private validateReference(
    transaction: WagerTransaction,
    wallet: Wallet,
    reference?: WagerTransaction,
  ): void {
    if (!reference) {
      throw new Error('Reference transaction not found');
    }

    if (reference.status !== WagerTransactionStatus.PROCESSED) {
      throw new Error('Reference transaction is not processed');
    }

    if (
      reference.providerId !== transaction.providerId ||
      reference.playerId !== transaction.playerId ||
      reference.walletId !== wallet.id ||
      reference.amount.currency !== transaction.amount.currency ||
      reference.roundId !== transaction.roundId
    ) {
      throw new Error('Reference transaction does not match');
    }

    if (!reference.amount.equals(transaction.amount)) {
      throw new Error('Reversal amount must match reference amount');
    }
  }

  private reject(
    transaction: WagerTransaction,
    code: WagerFailureCode,
    message: string,
  ): never {
    transaction.reject(code);
    throw new Error(message);
  }
}