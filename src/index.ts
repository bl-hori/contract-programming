import { config } from './config';

// Re-export config for user modification.
export { config };

/**
 * 事前条件をチェックするメソッドデコレータ。
 */
export function require(condition: (...args: any[]) => boolean, message: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      // Check is now inside the wrapper
      if (config.enabled && !condition.apply(this, args)) {
        config.violationHandler('Precondition', propertyKey, message);
      }
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * 事後条件をチェックするメソッドデコレータ。
 */
export function ensure(condition: (returnValue: any, ...args: any[]) => boolean, message: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const returnValue = originalMethod.apply(this, args);
      // Check is now inside the wrapper
      if (config.enabled && !condition.apply(this, [returnValue, ...args])) {
        config.violationHandler('Postcondition', propertyKey, message);
      }
      return returnValue;
    };

    return descriptor;
  };
}

/**
 * クラスの不変条件をチェックするクラスデコレータ。
 */
export function invariant(condition: (instance: any) => boolean, message: string) {
  return function <T extends { new (...args: any[]): {} }>(target: T): T {
    const methodNames = Object.getOwnPropertyNames(target.prototype);

    for (const methodName of methodNames) {
      if (methodName === 'constructor') continue;

      const descriptor = Object.getOwnPropertyDescriptor(target.prototype, methodName);
      if (!descriptor || typeof descriptor.value !== 'function') continue;

      const originalMethod = descriptor.value;

      const wrappedMethod = function (...args: any[]) {
        // Check is now inside the wrapper
        if (config.enabled && !condition(this)) {
          // Pass a clean, predictable message
          config.violationHandler('Invariant', methodName, `(before) ${message}`);
        }

        const result = originalMethod.apply(this, args);

        if (config.enabled && !condition(this)) {
          // Pass a clean, predictable message
          config.violationHandler('Invariant', methodName, `(after) ${message}`);
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
