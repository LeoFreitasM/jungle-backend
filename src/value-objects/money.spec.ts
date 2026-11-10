
import { describe, it, expect } from 'vitest';
import { Money } from './money.js';

describe('Money', () => {

describe('from', () => {
  it('should create money with two decimal places and uppercase currency', () => {
  
  const money = Money.from({ 
    amount: '100.50', 
    currency: 'brl' 
    });

    expect(money.toJSON().amount).toBe('100.50');
    expect(money.toJSON().currency).toBe('BRL');
    });

    it('should throw an error when amount is empty', () => {
        expect(() => Money.from({
            amount: '',
            currency: 'BRL'
        })).toThrow('Amount is required');
    });
        it('should throw an error when currency is empty', () => {
    expect(() => Money.from({
        amount: '100.00',
        currency: ''
    })).toThrow('Currency is required');
   });

        it('should throw an error when amount is NaN', () => {
        expect(() => Money.from({
            amount: 'NaN',
            currency: 'BRL'
        })).toThrow('Amount must be a finite number');
     });

     it('should throw an error when amount is Infinity', () => {
        expect(() => Money.from({
            amount: 'Infinity',
            currency: 'BRL',
        })).toThrow('Amount must be a finite number');
        });

     it('should throw an error when amount is negative Infinity', () => {
        expect(() => Money.from({
            amount: '-Infinity',
            currency: 'BRL',
        })).toThrow('Amount must be a finite number');
        });

        it('should throw an error when amount uses scientific notation', () => {
        expect(() => Money.from({
            amount: '1e3',
            currency: 'BRL',
        })).toThrow('Scientific notation is not allowed');
        });

        it('should throw an error when amount has more than two decimal places', () => {
        expect(() => Money.from({
            amount: '10.123',
            currency: 'BRL',
        })).toThrow('Amount must have at most 2 decimal places');
        });

        it('should accept amount with two decimal places', () => {
        const money = Money.from({
            amount: '10.50',
            currency: 'BRL',
        });

        expect(money.toJSON().amount).toBe('10.50');
        });

      });

describe('add()', () => {
    it('should add two money values', () => {
      const money1 = Money.from({ amount: '100.50', currency: 'brl' });
      const money2 = Money.from({ amount: '50.25', currency: 'brl' });
      const result = money1.add(money2);
      expect(result.toJSON().amount).toBe('150.75');
      expect(result.toJSON().currency).toBe('BRL');

    
 });

   it('should throw an error when adding money with different currencies', () => {
      const money1 = Money.from({ amount: '100.50', currency: 'brl' });
      const money2 = Money.from({ amount: '50.25', currency: 'usd' });
      expect(() => money1.add(money2)).toThrow('Cannot add Money values with different currencies: BRL and USD');
      
    });
    });

describe('subtract()', () => {
    it('should subtract two money values', () => {
      const money1 = Money.from({ amount: '100.50', currency: 'brl' });
      const money2 = Money.from({ amount: '50.25', currency: 'brl' });
      const result = money1.subtract(money2);
      expect(result.toJSON().amount).toBe('50.25');
      expect(result.toJSON().currency).toBe('BRL');
    });

    it('should throw an error when subtracting values ​​with different currencies', () => {
      const money1 = Money.from({ amount: '100.50', currency: 'brl' });
      const money2 = Money.from({ amount: '50.25', currency: 'usd' });
      expect(() => money1.subtract(money2)).toThrow('Cannot subtract Money values with different currencies: BRL and USD');
    });
    
  });

describe('negate()', () => {
    it('should negate a money value', () => {
      const money = Money.from({ amount: '100.50', currency: 'brl' });
      const result = money.negate();
      expect(result.toJSON().amount).toBe('-100.50');
      expect(result.toJSON().currency).toBe('BRL');
    });
  });

describe('isZero()', () => {
  it('should return true for zero money value', () => {
    const money = Money.from({ amount: '0.00', currency: 'brl' });
    expect(money.isZero()).toBe(true);
  });

  it('should return false for non-zero money value', () => {
    const money = Money.from({ amount: '100.00', currency: 'brl' });
    expect(money.isZero()).toBe(false);
  });
});

 describe('isPositive()', () => {
    it('should return true for positive money value', () => {
    const money = Money.from({ amount: '100.00', currency: 'brl' });
    expect(money.isPositive()).toBe(true);
    });
    it('should return false for negative money value', () => {
    const money = Money.from({ amount: '-100.00', currency: 'brl' });
    expect(money.isPositive()).toBe(false);
    });

 })

 describe('isNegative()', () => {
    it('should return true for negative money value', () => {
    const money = Money.from({ amount: '-100.00', currency: 'brl' });
    expect(money.isNegative()).toBe(true);
    });
    it('should return false for positive money value', () => {
    const money = Money.from({ amount: '100.00', currency: 'brl' });
    expect(money.isNegative()).toBe(false);
    })
  });

  describe('isLessThan()', () => {
    it('should return true when the first money value is less than the second', () => {
      const money1 = Money.from({ amount: '50.00', currency: 'brl' });
      const money2 = Money.from({ amount: '100.00', currency: 'brl' });
      expect(money1.isLessThan(money2)).toBe(true);
    });

    it('should return false when the first money value is not less than the second', () => {
      const money1 = Money.from({ amount: '100.00', currency: 'brl' });
      const money2 = Money.from({ amount: '50.00', currency: 'brl' });
      expect(money1.isLessThan(money2)).toBe(false);
    });

    it('should throw an error when comparing money values with different currencies', () => {
      const money1 = Money.from({ amount: '100.00', currency: 'brl' });
      const money2 = Money.from({ amount: '50.00', currency: 'usd' });
      expect(() => money1.isLessThan(money2)).toThrow('Cannot compare Money values with different currencies: BRL and USD');
    });
 });

 describe('equals()', () => {
    it('should return true when two money values are equal', () => {
      const money1 = Money.from({ amount: '100.00', currency: 'brl' });
      const money2 = Money.from({ amount: '100.00', currency: 'brl' });
      expect(money1.equals(money2)).toBe(true);
    });
    
    it('should return false when two money values are not equal', () => {
      const money1 = Money.from({ amount: '100.00', currency: 'brl' });
      const money2 = Money.from({ amount: '50.00', currency: 'brl' });
      expect(money1.equals(money2)).toBe(false);
    });

    it('should return false when two money values have different currencies', () => {
      const money1 = Money.from({ amount: '100.00', currency: 'brl' });
      const money2 = Money.from({ amount: '100.00', currency: 'usd' });
      expect(money1.equals(money2)).toBe(false);
    });
   });

describe('toJSON()', () => {
    it('should return a JSON representation of the money value', () => {
      const money = Money.from({ amount: '100.00', currency: 'brl' });
      const json = money.toJSON();
      expect(json).toEqual({ amount: '100.00', currency: 'BRL' });
    });
    it('should return a JSON representation of the money value with two decimal places', () => {
        const money = Money.from({ amount: '100', currency: 'brl' });
        const json = money.toJSON();
        expect(json).toEqual({ amount: '100.00', currency: 'BRL' });
      });
    });

describe('toString()', () => {
    it('should return a string representation of the money value', () => {
      const money = Money.from({ amount: '100.00', currency: 'brl' });
      const str = money.toString();
      expect(str).toBe('100.00 BRL');
    });
   });
  });

