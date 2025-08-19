import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { config as originalConfig, require as originalRequire } from '../src/index';
import type { ViolationHandler } from '../src/config';

// --- Test Setup ---
// Save original config state to restore between tests
const initialConfigSnapshot = { ...originalConfig };
const initialNodeEnv = process.env.NODE_ENV;

describe('Configuration', () => {
  // Restore config to its initial state before each test to ensure isolation
  beforeEach(() => {
    originalConfig.enabled = initialConfigSnapshot.enabled;
    originalConfig.violationHandler = initialConfigSnapshot.violationHandler;
    process.env.NODE_ENV = initialNodeEnv;
    vi.resetModules(); // This is crucial for NODE_ENV tests
  });

  // Just in case, restore after each test as well
  afterEach(() => {
    process.env.NODE_ENV = initialNodeEnv;
    vi.restoreAllMocks();
  });

  // --- Test Service ---
  class TestService {
    @originalRequire(val => val > 0, 'Value must be positive')
    doSomething(val: number) {
      return val;
    }
  }

  // --- Tests ---
  it('should be enabled by default in a non-production environment', () => {
    // Assuming the default test env is not 'production'
    expect(originalConfig.enabled).toBe(true);
    const service = new TestService();
    expect(() => service.doSomething(-1)).toThrow();
  });

  it('should not check contracts when config.enabled is manually set to false', () => {
    originalConfig.enabled = false;
    const service = new TestService();
    expect(() => service.doSomething(-1)).not.toThrow();
  });

  it('should use a custom violation handler when provided', () => {
    const customHandler = vi.fn(); // Create a mock function (spy)
    originalConfig.violationHandler = customHandler;

    const service = new TestService();
    service.doSomething(-5);

    expect(customHandler).toHaveBeenCalledOnce();
    expect(customHandler).toHaveBeenCalledWith(
      'Precondition',
      'doSomething',
      'Value must be positive'
    );
  });

  it('should be disabled by default when NODE_ENV is "production"', async () => {
    // Set NODE_ENV for the next import
    process.env.NODE_ENV = 'production';

    // Dynamically import the library to get the config evaluated with the new NODE_ENV
    const { config: prodConfig, require: prodRequire } = await import('../src/index');

    // Check if the config object reflects the production environment
    expect(prodConfig.enabled).toBe(false);

    // Define a class with a contract using the freshly imported decorator
    class ProductionService {
      @prodRequire(val => val > 0, 'This should not be checked')
      doSomething(val: number) {
        return val;
      }
    }

    // The contract should not be enforced
    const service = new ProductionService();
    expect(() => service.doSomething(-1)).not.toThrow();
  });
});
