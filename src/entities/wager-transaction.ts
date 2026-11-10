
import { Money, type MoneyProps } from '../value-objects/money.js';

export enum WagerTransactionKind {
  OPENING = 'OPENING',
  BET = 'BET',
  WIN = 'WIN',
  LOSS = 'LOSS',
  REFUND = 'REFUND',
  ROLLBACK = 'ROLLBACK',
}

export enum WagerTransactionStatus {
  PENDING = 'PENDING',
  PENDING_REFERENCE = 'PENDING_REFERENCE',
  PROCESSED = 'PROCESSED',
  REJECTED = 'REJECTED',
  FAILED = 'FAILED',
}

export enum WagerFailureCode {
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  INVALID_REFERENCE = 'INVALID_REFERENCE',
  REFERENCE_NOT_FOUND = 'REFERENCE_NOT_FOUND',
  REFERENCE_ALREADY_REVERSED = 'REFERENCE_ALREADY_REVERSED',
  REVERSAL_INSUFFICIENT_FUNDS = 'REVERSAL_INSUFFICIENT_FUNDS',
  INVALID_CURRENCY = 'INVALID_CURRENCY',
  INVALID_WALLET = 'INVALID_WALLET',
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  PERMANENT_PROCESSING_ERROR = 'PERMANENT_PROCESSING_ERROR',
}

export interface CreateWagerTransactionProps {
  id: string;
  playerId: string;
  walletId: string;
  amount: Money;
  kind: WagerTransactionKind;
  providerId?: string;
  externalTransactionId?: string;
  idempotencyKey?: string;
  payloadHash?: string;
  roundId?: string;
  gameId?: string;
  referenceExternalTransactionId?: string;
  referenceTransactionId?: string;
}

export interface WagerTransactionState {
  id: string;
  playerId: string;
  walletId: string;
  amount: MoneyProps;
  kind: WagerTransactionKind;
  status: WagerTransactionStatus;
  createdAt: Date;
  updatedAt: Date;
  providerId?: string;
  externalTransactionId?: string;
  idempotencyKey?: string;
  payloadHash?: string;
  roundId?: string;
  gameId?: string;
  referenceExternalTransactionId?: string;
  referenceTransactionId?: string;
  failureCode?: WagerFailureCode;
  processedAt?: Date;
  balanceAfter?: MoneyProps;
}

export class WagerTransaction {
  private constructor(
    public readonly id: string,
    public readonly playerId: string,
    public readonly walletId: string,
    public readonly amount: Money,
    public readonly kind: WagerTransactionKind,
    private _status: WagerTransactionStatus,
    public readonly createdAt: Date,
    private _updatedAt: Date,
    public readonly providerId?: string,
    public readonly externalTransactionId?: string,
    public readonly idempotencyKey?: string,
    public readonly payloadHash?: string,
    public readonly roundId?: string,
    public readonly gameId?: string,
    public readonly referenceExternalTransactionId?: string,
    private _referenceTransactionId?: string,
    private _failureCode?: WagerFailureCode,
    private _processedAt?: Date,
    private _balanceAfter?: Money,
  ) {}

  static create(props: CreateWagerTransactionProps): WagerTransaction {
    if (props.kind === WagerTransactionKind.OPENING) {
      throw new Error('OPENING transactions are internal only');
    }

    if (props.kind === WagerTransactionKind.LOSS) {
      if (!props.amount.isZero()) {
        throw new Error('LOSS transaction amount must be zero');
      }
    } else if (!props.amount.isPositive()) {
      throw new Error('Transaction amount must be positive');
    }

    if (
      (props.kind === WagerTransactionKind.REFUND ||
        props.kind === WagerTransactionKind.ROLLBACK) &&
      !props.referenceExternalTransactionId &&
      !props.referenceTransactionId
    ) {
      throw new Error('A reference transaction is required');
    }

    const now = new Date();

    return new WagerTransaction(
      props.id,
      props.playerId,
      props.walletId,
      props.amount,
      props.kind,
      WagerTransactionStatus.PENDING,
      now,
      now,
      props.providerId,
      props.externalTransactionId,
      props.idempotencyKey,
      props.payloadHash,
      props.roundId,
      props.gameId,
      props.referenceExternalTransactionId,
      props.referenceTransactionId,
    );
  }

  static rehydrate(state: WagerTransactionState): WagerTransaction {
    return new WagerTransaction(
      state.id,
      state.playerId,
      state.walletId,
      Money.from(state.amount),
      state.kind,
      state.status,
      state.createdAt,
      state.updatedAt,
      state.providerId,
      state.externalTransactionId,
      state.idempotencyKey,
      state.payloadHash,
      state.roundId,
      state.gameId,
      state.referenceExternalTransactionId,
      state.referenceTransactionId,
      state.failureCode,
      state.processedAt,
      state.balanceAfter ? Money.from(state.balanceAfter) : undefined,
    );
  }

  get status(): WagerTransactionStatus {
    return this._status;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get referenceTransactionId(): string | undefined {
    return this._referenceTransactionId;
  }

  get failureCode(): WagerFailureCode | undefined {
    return this._failureCode;
  }

  get processedAt(): Date | undefined {
    return this._processedAt;
  }

  get balanceAfter(): Money | undefined {
    return this._balanceAfter;
  }

  isRejected(): boolean {
    return this._status === WagerTransactionStatus.REJECTED;
  }

  isTerminal(): boolean {
    return (
      this._status === WagerTransactionStatus.PROCESSED ||
      this._status === WagerTransactionStatus.REJECTED ||
      this._status === WagerTransactionStatus.FAILED
    );
  }

  requiresReference(): boolean {
    return (
      this.kind === WagerTransactionKind.REFUND ||
      this.kind === WagerTransactionKind.ROLLBACK
    );
  }

  markProcessed(
    referenceTransactionId?: string,
    balanceAfter?: Money,
  ): void {
    this.assertCanTransition();

    this._status = WagerTransactionStatus.PROCESSED;
    this._referenceTransactionId = referenceTransactionId;
    this._processedAt = new Date();
    this._updatedAt = this._processedAt;
    this._balanceAfter = balanceAfter;
    this._failureCode = undefined;
  }

  reject(
    code: WagerFailureCode = WagerFailureCode.BUSINESS_RULE_VIOLATION,
  ): void {
    this.assertCanTransition();

    this._status = WagerTransactionStatus.REJECTED;
    this._failureCode = code;
    this._updatedAt = new Date();
  }

  fail(
    code: WagerFailureCode = WagerFailureCode.PERMANENT_PROCESSING_ERROR,
  ): void {
    this.assertCanTransition();

    this._status = WagerTransactionStatus.FAILED;
    this._failureCode = code;
    this._updatedAt = new Date();
  }

  markPendingReference(): void {
    this.assertCanTransition();

    this._status = WagerTransactionStatus.PENDING_REFERENCE;
    this._updatedAt = new Date();
  }

  markRejected(): void {
    this.reject();
  }

  markFailed(): void {
    this.fail();
  }

  private assertCanTransition(): void {
    if (this.isTerminal()) {
      throw new Error(`Cannot change transaction status from ${this._status}`);
    }

    if (
      this._status !== WagerTransactionStatus.PENDING &&
      this._status !== WagerTransactionStatus.PENDING_REFERENCE
    ) {
      throw new Error(`Invalid transaction state: ${this._status}`);
    }
  }
}
