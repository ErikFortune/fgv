import { printExpectedResult, printReceivedResult } from '../../utils/matcherHelpers';
import { matcherName, predicate } from './predicate';

import { Result } from '@fgv/ts-utils';
import { matcherHint } from 'jest-matcher-utils';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,  @typescript-eslint/naming-convention
    interface Matchers<R, T> {
      /**
       * Use .toSucceed to verify that a Result<T> is a success
       */
      toSucceed(): R;
    }
  }
}

function passMessage<T>(received: Result<T>): () => string {
  return () =>
    [
      matcherHint(`.not.${matcherName}`),
      printExpectedResult('success', false),
      printReceivedResult(received)
    ].join('\n');
}

function failMessage<T>(received: Result<T>): () => string {
  return () =>
    [matcherHint(`${matcherName}`), printExpectedResult('success', true), printReceivedResult(received)].join(
      '\n'
    );
}

export default {
  toSucceed: function <T>(received: Result<T>): jest.CustomMatcherResult {
    const pass = predicate(received);
    if (pass) {
      return { pass: true, message: passMessage(received) };
    }

    return { pass: false, message: failMessage(received) };
  }
};
