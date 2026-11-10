
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EntityManager } from '@mikro-orm/postgresql';

import { Money } from '../value-objects/money.js';
import { WagerTransaction } from '../entities/wager-transaction.js';
import { WagerPersistenceService } from './wager-persistence.service.js';

describe('WagerPersistenceService', () => {
  const txManager = {
    flush: vi.fn(),
  };

  const entityManager = {
    transactional: vi.fn(async (callback) => callback(txManager)),
  } as unknown as EntityManager;

  const wallet = {
    id: 'wallet-123',
    playerId: 'player-123',
  };

  const ledgerEntry = {
    id: 'ledger-123',
  };

  const walletRepository = {
    findByPlayerIdAndCurrency: vi.fn(),
    save: vi.fn(),
  };

  const transactionRepository = {
    save: vi.fn(),
    findByIdempotencyKey: vi.fn(),
  };  

  const ledgerRepository = {
    save: vi.fn(),
  };

  const processor = {
    process: vi.fn(),
  };

  const service = new WagerPersistenceService(
    entityManager,
    walletRepository as any,
    transactionRepository as any,
    ledgerRepository as any,
    processor as any,
  );

  const createTransaction = () =>
    WagerTransaction.create({
      id: 'transaction-123',
      playerId: 'player-123',
      walletId: 'wallet-123',
      amount: Money.from({
        amount: '20.00',
        currency: 'BRL',
      }),
      kind: 'BET' as any,
    });

  const idempotencyKey = 'request-123';
  const payloadHash = 'a'.repeat(64);

 beforeEach(() => {
    vi.clearAllMocks();

    transactionRepository.findByIdempotencyKey.mockResolvedValue(null);
    });

  it('should persist wallet, transaction and ledger entry', async () => {
    walletRepository.findByPlayerIdAndCurrency.mockResolvedValue(wallet);
    processor.process.mockReturnValue(ledgerEntry);

    const transaction = createTransaction();

    const result = await service.process(
      transaction,
      idempotencyKey,
      payloadHash,
    );

    expect(result).toEqual({
        transaction,
        ledgerEntry,
    });

    expect(walletRepository.save).toHaveBeenCalledWith(
      wallet,
      txManager,
    );

    expect(transactionRepository.save).toHaveBeenCalledWith(
      transaction,
      idempotencyKey,
      payloadHash,
      txManager,
    );

    expect(ledgerRepository.save).toHaveBeenCalledWith(
      ledgerEntry,
      txManager,
    );

    expect(txManager.flush).toHaveBeenCalledOnce();
  });

  it('should not persist changes when processing fails', async () => {
    walletRepository.findByPlayerIdAndCurrency.mockResolvedValue(wallet);

    processor.process.mockImplementation(() => {
      throw new Error('Insufficient balance');
    });

    const transaction = createTransaction();

    await expect(
      service.process(transaction, idempotencyKey, payloadHash),
    ).rejects.toThrow('Insufficient balance');

    expect(walletRepository.save).not.toHaveBeenCalled();
    expect(transactionRepository.save).not.toHaveBeenCalled();
    expect(ledgerRepository.save).not.toHaveBeenCalled();
  });
});
