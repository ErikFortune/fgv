import { equals } from '@jest/expect-utils';

export const matcherName: string = 'toHaveBeenCalledWithArgumentsMatching';

export interface IMatchedCall {
  index: number;
  arguments: unknown[];
}

export function predicate(received: jest.Mock, expected: unknown): undefined | IMatchedCall {
  for (let i = 0; i < received.mock.calls.length; i++) {
    const args = received.mock.calls[i];
    if (equals(args, expected)) {
      return { index: i, arguments: args };
    }
  }
  return undefined;
}
