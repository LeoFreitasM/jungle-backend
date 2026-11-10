
import {
  Entity,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';

import { LedgerDirection } from '../../../entities/wallet-ledger-entry.js';

@Unique({ properties: ['transactionId'] })
@Entity({ tableName: 'wallet_ledger_entries' })
export class WalletLedgerEntryEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ type: 'uuid' })
  walletId!: string;

  @Property({ type: 'uuid' })
  transactionId!: string;

  @Property({ type: 'string' })
  direction!: LedgerDirection;

  @Property({ type: 'decimal', precision: 19, scale: 2 })
  amount!: string;

  @Property({ type: 'string', length: 3 })
  currency!: string;

  @Property({ type: 'decimal', precision: 19, scale: 2 })
  balanceBefore!: string;

  @Property({ type: 'decimal', precision: 19, scale: 2 })
  balanceAfter!: string;

 @Property({ type: 'timestamptz' })
  createdAt = new Date();
}
