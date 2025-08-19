/**
 * 事前条件をチェックするメソッドデコレータ。
 * 条件が満たされない場合、エラーをスローします。
 *
 * @param condition 条件をチェックする関数。メソッドの引数をそのまま受け取ります。`this`はインスタンスを指します。
 * @param message 条件が満たされない場合にスローされるエラーのメッセージ。
 */
export function require(condition: (...args: any[]) => boolean, message: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      if (!condition.apply(this, args)) {
        throw new Error(`[Precondition failed] on ${propertyKey}: ${message}`);
      }
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * 事後条件をチェックするメソッドデコレータ。
 * 条件が満たされない場合、エラーをスローします。
 *
 * @param condition 条件をチェックする関数。第一引数に戻り値、以降にメソッドの引数を受け取ります。`this`はインスタンスを指します。
 * @param message 条件が満たされない場合にスローされるエラーのメッセージ。
 */
export function ensure(condition: (returnValue: any, ...args:any[]) => boolean, message: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const returnValue = originalMethod.apply(this, args);

      if (!condition.apply(this, [returnValue, ...args])) {
        throw new Error(`[Postcondition failed] on ${propertyKey}: ${message}`);
      }

      return returnValue;
    };

    return descriptor;
  };
}

/**
 * クラスの不変条件をチェックするクラスデコレータ。
 * すべての公開メソッドの実行前後で条件が満たされていることを保証します。
 *
 * @param condition 条件をチェックする関数。クラスのインスタンスを引数に受け取ります。
 * @param message 条件が満たされない場合にスローされるエラーのメッセージ。
 */
export function invariant(condition: (instance: any) => boolean, message: string) {
  return function <T extends { new (...args: any[]): {} }>(target: T): T {
    const methodNames = Object.getOwnPropertyNames(target.prototype);

    for (const methodName of methodNames) {
      if (methodName === 'constructor') {
        continue;
      }

      const descriptor = Object.getOwnPropertyDescriptor(target.prototype, methodName);
      const isMethod = descriptor && typeof descriptor.value === 'function';

      if (!isMethod) {
        continue;
      }

      const originalMethod = descriptor.value;

      const wrappedMethod = function (...args: any[]) {
        // Check invariant before method execution
        if (!condition(this)) {
          throw new Error(`[Invariant failed] before calling ${methodName}: ${message}`);
        }

        const result = originalMethod.apply(this, args);

        // Check invariant after method execution
        if (!condition(this)) {
          throw new Error(`[Invariant failed] after calling ${methodName}: ${message}`);
        }

        return result;
      };

      Object.defineProperty(target.prototype, methodName, {
        ...descriptor,
        value: wrappedMethod,
      });
    }

    return target;
  };
}
