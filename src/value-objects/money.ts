import { Decimal } from 'decimal.js';

export interface MoneyProps {
  amount: string;
  currency: string;
}

export class Money {
  private constructor(
    private readonly value: Decimal,
    public readonly currency: string,
    
  ) {}

static from(props: MoneyProps): Money {
 
  const currency = props.currency.trim().toUpperCase();

  if (props.amount.trim() === '') {
    throw new Error('Amount is required');
  }

  if (props.currency.trim() === '') {
    throw new Error('Currency is required');
  }

  if (props.amount.toLowerCase().includes('e')) {
  throw new Error('Scientific notation is not allowed');
}

  const amount = new Decimal(props.amount);

  if (!amount.isFinite()) {
  throw new Error('Amount must be a finite number');
}

  if(amount.decimalPlaces() > 2) {
    throw new Error('Amount must have at most 2 decimal places');
  }

  return new Money(amount, currency);
}

 static zero(currency: string): Money {
  currency = currency.trim().toUpperCase();

  if (!currency) {
    throw new Error('Currency is required');
  }

  return new Money(new Decimal(0), currency);

}

  add(other: Money): Money{

   if (this.currency !== other.currency) {
      throw new Error(`Cannot add Money values with different currencies: ${this.currency} and ${other.currency}`);
    }

    return new Money(this.value.plus(other.value), this.currency);
  }

  subtract(other: Money): Money{
    if (this.currency !== other.currency) {
      throw new Error(`Cannot subtract Money values with different currencies: ${this.currency} and ${other.currency}`);
    }

    return new Money(this.value.minus(other.value), this.currency);
  }

  negate(): Money{
        return new Money(this.value.negated(), this.currency);
  }

  isZero(): boolean{
    return this.value.isZero();
  }

  isPositive(): boolean{
    return this.value.isPositive();
  }

  isNegative(): boolean{
    return this.value.isNegative();
  }

  isLessThan(other: Money): boolean{
    this.assertSameCurrency(other);
    return this.value.lessThan(other.value);
  }

  equals(other: Money): boolean{
   return this.currency === other.currency && this.value.equals(other.value);
  }

  toJSON(): MoneyProps{
     
    return {
      amount: this.value.toFixed(2),
      currency: this.currency,
    };

  }

  toString(): string{
    return this.value.toFixed(2) + ' ' + this.currency.toString();
  }

  private assertSameCurrency(other: Money): void{
    if (this.currency !== other.currency) {
      throw new Error(`Cannot compare Money values with different currencies: ${this.currency} and ${other.currency}`);
    }
  }

}