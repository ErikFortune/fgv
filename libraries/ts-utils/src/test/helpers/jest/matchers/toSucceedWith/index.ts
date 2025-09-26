import { printExpectedResult, printReceivedResult } from '../../utils/matcherHelpers';
import { matcherName, predicate } from './predicate';

import { matcherHint } from 'jest-matcher-utils';
import { Result, ResultValueType } from '../../../../../index';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R, T> {
      /**
       * Use .toSucceedWith to verify that a Result\<T\> is a success
       * and that the result value matches the supplied value
       * @param expected -
       */
      toSucceedWith(expected: ResultValueType<T> | RegExp): R;
    }
  }
}

function passMessage<T extends Result<unknown>>(
  received: T,
  expected: ResultValueType<T> | RegExp
): () => string {
  return () =>
    [
      matcherHint(`.not.${matcherName}`),
      printExpectedResult('success', false, expected),
      printReceivedResult(received)
    ].join('\n');
}

function failMessage<T extends Result<unknown>>(
  received: T,
  expected: ResultValueType<T> | RegExp
): () => string {
  return () =>
    [
      matcherHint(`${matcherName}`),
      printExpectedResult('success', true, expected),
      printReceivedResult(received)
    ].join('\n');
}

export default {
  toSucceedWith: function <T extends Result<unknown>>(
    received: T,
    expected: ResultValueType<T> | RegExp
  ): jest.CustomMatcherResult {
    const pass = predicate(received, expected);
    if (pass) {
      return { pass: true, message: passMessage(received, expected) };
    }

    return { pass: false, message: failMessage(received, expected) };
  }
};
