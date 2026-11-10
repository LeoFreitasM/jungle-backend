import { describe, expect, it, vi } from 'vitest';
import { EntityManager } from '@mikro-orm/postgresql';

import { WalletRepository } from './wallet.repository.js';
import { WalletEntity } from '../entities/wallet.entities.js';
import { Wallet } from '../../../entities/wallet.js';
import { Money } from '../../../value-objects/money.js';

describe('WalletRepository', () => {
  const persist = vi.fn();
  const flush = vi.fn();
  const findOne = vi.fn();

  const entityManager = {
    persist,
    flush,
    findOne,
  } as unknown as EntityManager;

  const repository = new WalletRepository(entityManager);

  it('should save a wallet', async () => {
    const wallet = Wallet.open({
      id: 'wallet-123',
      playerId: 'player-123',
      initialBalance: Money.from({
        amount: '100.00',
        currency: 'BRL',
      }),
    });

    await repository.save(wallet);

    expect(persist).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'wallet-123',
        playerId: 'player-123',
        balance: '100.00',
        currency: 'BRL',
      }),
    );

  });

  it('should return null when wallet does not exist', async () => {
    findOne.mockResolvedValue(null);

    const result = await repository.findByPlayerIdAndCurrency(
      'player-123',
      'BRL',
    );

    expect(result).toBeNull();
  });

  it('should find and rehydrate a wallet', async () => {
    const entity = Object.assign(new WalletEntity(), {
      id: 'wallet-123',
      playerId: 'player-123',
      currency: 'BRL',
      balance: '250.75',
      version: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    findOne.mockResolvedValue(entity);

    const result = await repository.findByPlayerIdAndCurrency(
      'player-123',
      'BRL',
    );

    expect(result).toBeInstanceOf(Wallet);
    expect(result?.balance.toJSON()).toEqual({
      amount: '250.75',
      currency: 'BRL',
    });
    expect(result?.version).toBe(2);
  });
});