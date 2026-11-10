
import {
  Entity,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';

import {
  WagerTransactionKind,
  WagerTransactionStatus,
  WagerFailureCode,
} from '../../../entities/wager-transaction.js';

@Entity({ tableName: 'wager_transactions' })
@Unique({ properties: ['providerId', 'externalTransactionId'] })
@Unique({ properties: ['referenceTransactionId', 'kind'] })
export class WagerTransactionEntity {
  @PrimaryKey()
  id!: string;

  @Property()
  playerId!: string;

  @Property()
  walletId!: string;

  @Property()
  providerId!: string;

  @Property()
  externalTransactionId!: string;

  @Property({ nullable: true })
  referenceExternalTransactionId?: string;

  @Property({ nullable: true })
  referenceTransactionId?: string;

  @Property()
  roundId!: string;

  @Property()
  gameId!: string;

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  amount!: string;

  @Property({ length: 3 })
  currency!: string;

  @Property()
  kind!: WagerTransactionKind;

  @Property()
  status!: WagerTransactionStatus;

  @Property({ nullable: true })
  failureCode?: WagerFailureCode;

  @Property({ nullable: true })
  processedAt?: Date;

  @Property({
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: true,
  })
  balanceAfter?: string | null;

  @Property({ unique: true })
  idempotencyKey!: string;

  @Property({ nullable: true })
  payloadHash?: string;

  @Property()
  createdAt!: Date;

  @Property({ onUpdate: () => new Date() })
  updatedAt!: Date;
}
