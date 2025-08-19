import { describe, it, expect } from 'vitest';
import { invariant, require, ensure } from '../src/index';

// --- Test Case 1: Basic Invariant ---
@invariant(acc => acc.balance >= 0, 'Account balance cannot be negative')
class BankAccount {
  public balance: number;

  constructor(initialBalance: number) {
    this.balance = initialBalance;
  }

  @require(amount => amount > 0, 'Deposit amount must be positive')
  deposit(amount: number): void {
    this.balance += amount;
  }

  @require(amount => amount > 0, 'Withdrawal amount must be positive')
  withdraw(amount: number): void {
    if (this.balance >= amount) {
      this.balance -= amount;
    }
  }

  // This method intentionally breaks the invariant
  buggyWithdraw(amount: number): void {
    this.balance -= amount;
  }
}

describe('@invariant decorator', () => {
  it('should not throw an error if the invariant is maintained', () => {
    const account = new BankAccount(100);
    expect(() => account.deposit(50)).not.toThrow();
    expect(account.balance).toBe(150);
    expect(() => account.withdraw(100)).not.toThrow();
    expect(account.balance).toBe(50);
  });

  it('should throw an error if the invariant is violated after a method call', () => {
    const account = new BankAccount(100);
    // This call will reduce the balance to -50, violating the invariant.
    expect(() => account.buggyWithdraw(150)).toThrow('[Invariant failed] on buggyWithdraw: (after) Account balance cannot be negative');
  });

  it('should throw an error if the invariant is already violated before a method call', () => {
    const account = new BankAccount(100);
    // Manually violate the invariant
    account.balance = -50;

    // Now, any method call should fail before it even starts.
    expect(() => account.deposit(10)).toThrow('[Invariant failed] on deposit: (before) Account balance cannot be negative');
  });

  it('should not wrap the constructor', () => {
    // If the constructor was wrapped, creating an instance with a negative balance would throw.
    // The invariant should only be checked for method calls on the instance.
    expect(() => new BankAccount(-50)).not.toThrow();
  });

  // --- Test Case 2: Interaction with other decorators ---
  @invariant(s => s.value > 0, 'Value must be positive')
  class SpecialService {
    public value: number = 1;

    @require(function(input) { return typeof input === 'number'; }, 'Input must be a number')
    @ensure(function(result, input) { return result === this.value && result > input; }, 'Result must be the new value and greater than the input')
    update(input: number) {
      const oldValue = this.value;
      const result = oldValue + input;
      this.value = result;
      return result;
    }

    // This method breaks the invariant
    setToZero() {
      this.value = 0;
    }
  }

  it('should work correctly with @require and @ensure decorators', () => {
    const service = new SpecialService();

    // Valid call
    expect(() => service.update(5)).not.toThrow();
    expect(service.value).toBe(6);

    // Call that violates @require
    // @ts-ignore
    expect(() => service.update("hello")).toThrow('[Precondition failed] on update: Input must be a number');

    // Call that violates the invariant
    expect(() => service.setToZero()).toThrow('[Invariant failed] on setToZero: (after) Value must be positive');
  });
});
