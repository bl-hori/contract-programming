import { describe, it, expect } from 'vitest';
import { ensure, require } from '../src/index';

class CalculatorService {
  @ensure(result => result > 0, 'Result must be positive')
  add(a: number, b: number): number {
    return a + b;
  }

  @ensure((result, a, b) => result === a - b, 'Result must be the difference of a and b')
  subtract(a: number, b: number): number {
    return a - b;
  }

  @ensure(result => result !== null, 'User should not be null')
  findUser(id: number): { id: number; name: string } | null {
    if (id === 1) {
      return { id: 1, name: 'Jules' };
    }
    return null;
  }

  @require((a: number, b: number) => a > 0 && b > 0, 'Inputs must be positive')
  @ensure(result => result > 0, 'Result must be positive')
  multiply(a: number, b: number): number {
    return a * b;
  }
}

describe('@ensure decorator', () => {
  const service = new CalculatorService();

  it('should not throw an error if the postcondition is met', () => {
    expect(() => service.add(2, 3)).not.toThrow();
    expect(service.add(2, 3)).toBe(5);
  });

  it('should throw an error if the postcondition is not met', () => {
    expect(() => service.add(1, -5)).toThrow('[Postcondition failed] on add: Result must be positive');
  });

  it('should validate condition using return value and original arguments', () => {
    // Test the success case
    expect(() => service.subtract(10, 3)).not.toThrow();
    expect(service.subtract(10, 3)).toBe(7);

    // Test the failure case by using a class with a known bug
    class ServiceWithBug {
      @ensure((result, a, b) => result === a - b, 'Result must be the difference of a and b')
      buggySubtract(a: number, b: number): number {
        return a + b; // This implementation is intentionally incorrect
      }
    }
    const buggyService = new ServiceWithBug();
    expect(() => buggyService.buggySubtract(10, 3)).toThrow('[Postcondition failed] on buggySubtract: Result must be the difference of a and b');
  });

  it('should handle non-primitive return values like null', () => {
    expect(() => service.findUser(1)).not.toThrow();
    expect(service.findUser(1)).toEqual({ id: 1, name: 'Jules' });

    expect(() => service.findUser(2)).toThrow('[Postcondition failed] on findUser: User should not be null');
  });

  it('should work correctly with other decorators like @require', () => {
    expect(() => service.multiply(3, 4)).not.toThrow();
    expect(service.multiply(3, 4)).toBe(12);

    expect(() => service.multiply(-3, 4)).toThrow('[Precondition failed] on multiply: Inputs must be positive');
  });
});
