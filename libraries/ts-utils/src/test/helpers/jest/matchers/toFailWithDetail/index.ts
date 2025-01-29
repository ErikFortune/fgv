import { printExpectedDetailedResult, printReceivedDetailedResult } from '../../utils/matcherHelpers';
import { matcherName, predicate } from './predicate';

import { matcherHint } from 'jest-matcher-utils';
import { DetailedResult, ResultDetailType } from '../../ts-utils';

// eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars, @typescript-eslint/ban-types, @typescript-eslint/naming-convention
    interface Matchers<R, T> {
      /**
       * Use .toFailWithDetail to verify that a DetailedResult<T> is
       * a failure that matches both a supplied expected failure message
       * (string, RegExp or undefined) and a supplied failure detail.
       * @param message -
       */
      toFailWithDetail(message: string | RegExp | undefined, detail: ResultDetailType<T>): R;
    }
  }
}

function passMessage<T, TD>(
  received: DetailedResult<T, TD>,
  expectedMessage: string | RegExp | undefined,
  expectedDetail: TD
): () => string {
  return () =>
    [
      matcherHint(`.not.${matcherName}`),
      printExpectedDetailedResult('failure', false, expectedMessage, expectedDetail),
      printReceivedDetailedResult(received)
    ].join('\n');
}

function failMessage<T, TD>(
  received: DetailedResult<T, TD>,
  expectedMessage: string | RegExp | undefined,
  expectedDetail: TD
): () => string {
  return () =>
    [
      matcherHint(`${matcherName}`),
      printExpectedDetailedResult('failure', true, expectedMessage, expectedDetail),
      printReceivedDetailedResult(received)
    ].join('\n');
}

export default {
  toFailWithDetail: function <T extends DetailedResult<unknown, unknown>>(
    received: T,
    expectedMessage: string | RegExp | undefined,
    expectedDetail: ResultDetailType<T>
  ): jest.CustomMatcherResult {
    const pass = predicate(received, expectedMessage, expectedDetail);
    if (pass) {
      return { pass: true, message: passMessage(received, expectedMessage, expectedDetail) };
    }

    return { pass: false, message: failMessage(received, expectedMessage, expectedDetail) };
  }
};
