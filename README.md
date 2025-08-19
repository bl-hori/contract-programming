# TypeScript Design by Contract Library

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/bl-hori/contract-programming)

A lightweight, zero-dependency library for implementing Design by Contract (DbC) principles in TypeScript using decorators. Enforce preconditions, postconditions, and class invariants at runtime to build more robust and self-documenting code.

---

## Features

-   **`@require`**: Defines preconditions for method arguments.
-   **`@ensure`**: Defines postconditions for method return values.
-   **`@invariant`**: Defines invariants for class instances that must hold true before and after every method call.
-   **Configurable**: Enable/disable contracts globally or based on `NODE_ENV`.
-   **Custom Violation Handling**: Define your own logic for handling contract violations (e.g., throw, warn, log).
-   **Zero-Overhead when Disabled**: No performance impact in production when contracts are turned off.

---

## Installation

```bash
npm install @my-scope/contract
```

---

## Usage

### `@require` (Preconditions)

Use `@require` to validate method arguments before the method body is executed.

```typescript
import { require } from '@my-scope/contract';

class Calculator {
  @require(a => a > 0, 'Argument "a" must be positive')
  @require((a, b) => b > a, 'Argument "b" must be greater than "a"')
  public calculate(a: number, b: number): number {
    return b - a;
  }
}

const calc = new Calculator();
calc.calculate(5, 10); // OK

// Throws: [Precondition failed] on calculate: Argument "a" must be positive
calc.calculate(-1, 10);
```

### `@ensure` (Postconditions)

Use `@ensure` to validate the return value of a method after it has executed. The condition function receives the return value as its first argument.

```typescript
import { ensure } from '@my-scope/contract';

class UserService {
  @ensure(user => user !== null, 'User must not be null')
  public findById(id: number): { id: number } | null {
    if (id === 1) {
      return { id: 1 };
    }
    return null;
  }
}

const users = new UserService();
users.findById(1); // OK

// Throws: [Postcondition failed] on findById: User must not be null
users.findById(2);
```

### `@invariant` (Invariants)

Use `@invariant` on a class to define a condition that must *always* be true for an instance, both before and after any public method is called.

```typescript
import { invariant, require } from '@my-scope/contract';

@invariant(account => account.balance >= 0, 'Balance must not be negative')
class BankAccount {
  public balance: number;

  constructor(initialBalance: number) {
    this.balance = initialBalance;
  }

  @require(amount => amount > 0, 'Deposit amount must be positive')
  public deposit(amount: number): void {
    this.balance += amount;
  }

  public withdraw(amount: number): void {
    this.balance -= amount;
  }
}

const account = new BankAccount(100);
account.deposit(50); // OK, balance is 150

// Throws: [Invariant failed] on withdraw: (after) Balance must not be negative
account.withdraw(200);
```

---

## Configuration

You can configure the library's behavior globally.

### Enabling / Disabling Contracts

Contracts are enabled by default, except when `process.env.NODE_ENV` is `'production'`. You can override this manually.

```typescript
import { config } from '@my-scope/contract';

// Disable all contract checks
config.enabled = false;

// Re-enable them
config.enabled = true;
```

When disabled, the decorators have zero performance overhead as they do not wrap the methods at all.

### Custom Violation Handler

By default, the library throws an error on a contract violation. You can change this by providing a custom `violationHandler`.

```typescript
import { config } from '@my-scope/contract';

// Log warnings to the console instead of throwing errors
config.violationHandler = (type, methodName, message) => {
  console.warn(`[${type} Violation] in ${methodName}: ${message}`);
};

// Now, contract violations will log a warning and execution will continue.
const calc = new Calculator();
calc.calculate(-1, 10);
// Logs: [Precondition Violation] in calculate: Argument "a" must be positive
```

---

## License

This project is licensed under the ISC License.
