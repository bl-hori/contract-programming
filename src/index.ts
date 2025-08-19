/**
 * 事前条件をチェックするメソッドデコレータ。
 * 条件が満たされない場合、エラーをスローします。
 *
 * @param condition 条件をチェックする関数。メソッドの引数をそのまま受け取ります。
 * @param message 条件が満たされない場合にスローされるエラーのメッセージ。
 */
export function require(condition: (...args: any[]) => boolean, message: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      if (!condition(...args)) {
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
 * @param condition 条件をチェックする関数。第一引数に戻り値、以降にメソッドの引数を受け取ります。
 * @param message 条件が満たされない場合にスローされるエラーのメッセージ。
 */
export function ensure(condition: (returnValue: any, ...args: any[]) => boolean, message: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const returnValue = originalMethod.apply(this, args);

      if (!condition(returnValue, ...args)) {
        throw new Error(`[Postcondition failed] on ${propertyKey}: ${message}`);
      }

      return returnValue;
    };

    return descriptor;
  };
}
