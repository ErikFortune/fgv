import { printExpectedResult, printReceivedResult } from '../../utils/matcherHelpers';
import { matcherName, predicate } from './predicate';

import { matcherHint } from 'jest-matcher-utils';
import { Result } from '../../../../../index';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface Matchers<R> {
      /**
       * Use .toSucceedWith to verify that a Result<T> is a success
       * and that the result value matches the supplied value
       * @param expected -
       */
      toSucceedWith(expected: unknown): R;
    }
  }
}

function passMessage<T>(received: Result<T>, expected: T): () => string {
  return () =>
    [
      matcherHint(`.not.${matcherName}`),
      printExpectedResult('success', false, expected),
      printReceivedResult(received)
    ].join('\n');
}

function failMessage<T>(received: Result<T>, expected: T): () => string {
  return () =>
    [
      matcherHint(`${matcherName}`),
      printExpectedResult('success', true, expected),
      printReceivedResult(received)
    ].join('\n');
}

export default {
  toSucceedWith: function <T>(received: Result<T>, expected: unknown): jest.CustomMatcherResult {
    const pass = predicate(received, expected);
    if (pass) {
      return { pass: true, message: passMessage(received, expected) };
    }

    return { pass: false, message: failMessage(received, expected) };
  }
};
