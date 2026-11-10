
import { describe, it, expect } from 'vitest';
import { Money } from '../value-objects/money.js';
import { Wallet } from '../entities/wallet.js';
import {
  WagerTransaction,
  WagerTransactionKind,
  WagerTransactionStatus,
} from '../entities/wager-transaction.js';
import { WagerProcessorService } from './wager-processor.service.js';

describe('WagerProcessorService', () => {
  const service = new WagerProcessorService();

  it('should debit wallet when processing a BET', () => {
    const wallet = Wallet.open({
      id: 'wallet-1',
      playerId: 'player-1',
      initialBalance: Money.from({
        amount: '100.00',
        currency: 'BRL',
      }),
    });

    const transaction = WagerTransaction.create({
      id: 'transaction-1',
      playerId: 'player-1',
      walletId: 'wallet-1',
      amount: Money.from({
        amount: '20.00',
        currency: 'BRL',
      }),
      kind: WagerTransactionKind.BET,
    });

    const ledger = service.process(transaction, wallet);

    expect(wallet.balance.equals(
      Money.from({ amount: '80.00', currency: 'BRL' }),
    )).toBe(true);

    expect(ledger).not.toBeNull();
    expect(transaction.status).toBe(WagerTransactionStatus.PROCESSED);
  });

  it('should credit wallet when processing a WIN', () => {
    const wallet = Wallet.open({
      id: 'wallet-1',
      playerId: 'player-1',
      initialBalance: Money.from({
        amount: '100.00',
        currency: 'BRL',
      }),
    });

    const transaction = WagerTransaction.create({
      id: 'transaction-2',
      playerId: 'player-1',
      walletId: 'wallet-1',
      amount: Money.from({
        amount: '50.00',
        currency: 'BRL',
      }),
      kind: WagerTransactionKind.WIN,
    });

    service.process(transaction, wallet);

    expect(wallet.balance.equals(
      Money.from({ amount: '150.00', currency: 'BRL' }),
    )).toBe(true);

    expect(transaction.status).toBe(WagerTransactionStatus.PROCESSED);
  });

  it('should reject BET when wallet has insufficient balance', () => {
    const wallet = Wallet.open({
      id: 'wallet-1',
      playerId: 'player-1',
      initialBalance: Money.from({
        amount: '10.00',
        currency: 'BRL',
      }),
    });

    const transaction = WagerTransaction.create({
      id: 'transaction-3',
      playerId: 'player-1',
      walletId: 'wallet-1',
      amount: Money.from({
        amount: '50.00',
        currency: 'BRL',
      }),
      kind: WagerTransactionKind.BET,
    });

    expect(() => service.process(transaction, wallet)).toThrow();

    expect(transaction.status).toBe(WagerTransactionStatus.REJECTED);
  });
});
