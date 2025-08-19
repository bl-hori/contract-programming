import { describe, it, expect } from 'vitest';
import { require } from '../src/index';

class TestService {
  @require((value: number) => value > 0, 'value must be positive')
  testMethod(value: number): number {
    return value * 2;
  }

  @require((a: number, b: number) => a > b, 'a must be greater than b')
  sum(a: number, b: number): number {
    return a + b;
  }
}

describe('@require decorator', () => {
  const service = new TestService();

  it('should not throw an error if the precondition is met', () => {
    // service.testMethod(10) を実行してもエラーがスローされないことを確認
    expect(() => service.testMethod(10)).not.toThrow();
    // 実際にメソッドが実行され、正しい値が返されることを確認
    expect(service.testMethod(10)).toBe(20);
  });

  it('should throw an error if the precondition is not met', () => {
    // service.testMethod(0) を実行するとエラーがスローされることを確認
    expect(() => service.testMethod(0)).toThrow('[Precondition failed] on testMethod: value must be positive');
    // service.testMethod(-5) を実行するとエラーがスローされることを確認
    expect(() => service.testMethod(-5)).toThrow();
  });

  it('should work with multiple arguments', () => {
    // 条件を満たす場合
    expect(() => service.sum(5, 3)).not.toThrow();
    expect(service.sum(5, 3)).toBe(8);

    // 条件を満たさない場合
    expect(() => service.sum(3, 5)).toThrow('[Precondition failed] on sum: a must be greater than b');
  });
});
