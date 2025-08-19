export type ViolationType = 'Precondition' | 'Postcondition' | 'Invariant';

export type ViolationHandler = (type: ViolationType, methodName: string, message: string) => void;

const defaultViolationHandler: ViolationHandler = (type, methodName, message) => {
  throw new Error(`[${type} failed] on ${methodName}: ${message}`);
};

interface Config {
  enabled: boolean;
  violationHandler: ViolationHandler;
}

export const config: Config = {
  // By default, contracts are disabled in a production environment.
  enabled: process.env.NODE_ENV !== 'production',
  violationHandler: defaultViolationHandler,
};
