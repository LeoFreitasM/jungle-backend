import { Money, type MoneyProps } from '../value-objects/money.js';

export enum LedgerDirection { 
    Debit = "DEBIT", 
    Credit = "CREDIT" 
}

export interface CreateLedgerEntryProps {
  id: string;
  walletId: string;
  transactionId: string;
  direction: LedgerDirection;
  money: Money;
  balanceBefore: Money;
  balanceAfter: Money;
  createdAt: Date;
}

export interface LedgerEntryState {
  id: string;
  walletId: string;
  transactionId: string;
  direction: LedgerDirection;
  money: MoneyProps;
  balanceBefore: MoneyProps;
  balanceAfter: MoneyProps;
  createdAt: Date;
}

export class WalletLedgerEntry {
  private constructor(
    public readonly id: string,
    public readonly walletId: string,
    public readonly transactionId: string,
    public readonly direction: LedgerDirection,
    public readonly money: Money,
    public readonly balanceBefore: Money,
    public readonly balanceAfter: Money,
    public readonly createdAt: Date,
  ) {}

  static create(props: CreateLedgerEntryProps): WalletLedgerEntry{

    const entry = new WalletLedgerEntry(
        props.id,
        props.walletId,
        props.transactionId,
        props.direction,
        props.money,
        props.balanceBefore,
        props.balanceAfter,
        props.createdAt,
   );

     if (!entry.isBalanced()) {
        throw new Error('Invalid ledger entry: balance is inconsistent');
   }

    return entry;
   }

  static rehydrate(state: LedgerEntryState): WalletLedgerEntry{
       const money = Money.from(state.money);
       const balanceBefore = Money.from(state.balanceBefore);
       const balanceAfter = Money.from(state.balanceAfter);

       const entry = new WalletLedgerEntry(
        state.id,
        state.walletId,
        state.transactionId,
        state.direction,
        money,
        balanceBefore,
        balanceAfter,
        state.createdAt,
       )

       return entry;

  }

  /** balanceBefore ± money === balanceAfter. Verificada na factory. */
 isBalanced(): boolean {
  let result: Money;

  if (this.direction === LedgerDirection.Credit) {
    result = this.balanceBefore.add(this.money);
  } else {
    result = this.balanceBefore.subtract(this.money);
  }

  return result.equals(this.balanceAfter);
}
}