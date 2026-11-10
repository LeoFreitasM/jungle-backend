import { Money } from '../value-objects/money.js';
import {
  LedgerDirection,
  WalletLedgerEntry,
} from '../entities/wallet-ledger-entry.js';
import { randomUUID } from 'node:crypto';

export interface WalletState {
  id: string;
  playerId: string;
  currency: string;
  balance: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Wallet {
  private constructor(
    public readonly id: string,
    public readonly playerId: string,
    public readonly currency: string,
    private _balance: Money,
    private _version: number,
    public readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  static open(props: {
    id: string;
    playerId: string;
    initialBalance: Money;
  }): Wallet {
    const initialBalance = props.initialBalance;
    const currency = initialBalance.currency;

    if (initialBalance.isNegative()) {
      throw new Error('Initial balance cannot be negative');
    }

    const now = new Date();

    return new Wallet(
      props.id,
      props.playerId,
      currency,
      initialBalance,
      1,
      now,
      now,
    );
  }

  static rehydrate(state: WalletState): Wallet {
    return new Wallet(
      state.id,
      state.playerId,
      state.currency,
      Money.from({
        amount: state.balance,
        currency: state.currency,
      }),
      state.version,
      state.createdAt,
      state.updatedAt,
    );
  }

  get balance(): Money {
    return this._balance;
  }

  get version(): number {
    return this._version;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  private assertSameCurrency(money: Money): void {
    if (this.currency !== money.currency) {
      throw new Error(
        `Cannot operate on Money values with different currencies: ${this.currency} and ${money.currency}`,
      );
    }
  }

  debit(amount: Money, transactionId: string): WalletLedgerEntry | null {
    this.assertSameCurrency(amount);

    if (amount.isNegative()) {
      throw new Error('Cannot debit a negative amount');
    }

    if (this.balance.isLessThan(amount)) {
      throw new Error('Insufficient balance');
    }

    if (amount.isZero()) {
      return null;
    }

    const now = new Date();
    const balanceBefore = this._balance;
    const balanceAfter = this._balance.subtract(amount);

    const ledgerEntry = WalletLedgerEntry.create({
      id: randomUUID(),
      walletId: this.id,
      transactionId,
      direction: LedgerDirection.Debit,
      money: amount,
      balanceBefore,
      balanceAfter,
      createdAt: now,
    });

    this._balance = balanceAfter;
    this._version += 1;
    this._updatedAt = now;

    return ledgerEntry;
  }

  credit(amount: Money, transactionId: string): WalletLedgerEntry | null {
    this.assertSameCurrency(amount);

    if (amount.isNegative()) {
      throw new Error('Cannot credit a negative amount');
    }

    if (amount.isZero()) {
      return null;
    }

    const now = new Date();
    const balanceBefore = this._balance;
    const balanceAfter = this._balance.add(amount);

    const ledgerEntry = WalletLedgerEntry.create({
      id: randomUUID(),
      walletId: this.id,
      transactionId,
      direction: LedgerDirection.Credit,
      money: amount,
      balanceBefore,
      balanceAfter,
      createdAt: now,
    });

    this._balance = balanceAfter;
    this._version += 1;
    this._updatedAt = now;

    return ledgerEntry;
  }
}