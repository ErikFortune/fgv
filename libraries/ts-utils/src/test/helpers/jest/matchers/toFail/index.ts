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
       * Use .toFail to verify that a Result<T> is a failure
       */
      toFail(): R;
    }
  }
}

function passMessage<T>(received: Result<T>): () => string {
  return () =>
    [
      matcherHint(`.not.${matcherName}`),
      printExpectedResult('failure', false),
      printReceivedResult(received)
    ].join('\n');
}

function failMessage<T>(received: Result<T>): () => string {
  return () =>
    [matcherHint(`${matcherName}`), printExpectedResult('failure', true), printReceivedResult(received)].join(
      '\n'
    );
}

export default {
  toFail: function <T>(received: Result<T>): jest.CustomMatcherResult {
    const pass = predicate(received);
    if (pass) {
      return { pass: true, message: passMessage(received) };
    }

    return { pass: false, message: failMessage(received) };
  }
};
