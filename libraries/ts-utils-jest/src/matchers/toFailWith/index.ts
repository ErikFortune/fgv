import { printExpectedResult, printReceivedResult } from '../../utils/matcherHelpers';
import { matcherName, predicate } from './predicate';

import { Result } from '@fgv/ts-utils';
import { matcherHint } from 'jest-matcher-utils';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-types, @typescript-eslint/naming-convention
    interface Matchers<R, T> {
      /**
       * Use .toFailWith to verify that a Result<T> is a failure
       * that matches a supplied string, RegExp or undefined value
       * @param message -
       */
      toFailWith(message: string | RegExp | undefined): R;
    }
  }
}

function passMessage<T>(received: Result<T>, expected: string | RegExp | undefined): () => string {
  return () =>
    [
      matcherHint(`.not.${matcherName}`),
      printExpectedResult('failure', false, expected),
      printReceivedResult(received)
    ].join('\n');
}

function failMessage<T>(received: Result<T>, expected: string | RegExp | undefined): () => string {
  return () =>
    [
      matcherHint(`${matcherName}`),
      printExpectedResult('failure', true, expected),
      printReceivedResult(received)
    ].join('\n');
}

export default {
  toFailWith: function <T>(
    received: Result<T>,
    expected: string | RegExp | undefined
  ): jest.CustomMatcherResult {
    const pass = predicate(received, expected);
    if (pass) {
      return { pass: true, message: passMessage(received, expected) };
    }

    return { pass: false, message: failMessage(received, expected) };
  }
};
