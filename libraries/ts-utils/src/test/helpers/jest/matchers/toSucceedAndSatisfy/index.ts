import { Result, ResultValueType } from '../../ts-utils';
import { printExpectedResult, printReceivedResult } from '../../utils/matcherHelpers';
import { matcherName, predicate } from './predicate';

import { matcherHint } from 'jest-matcher-utils';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars,  @typescript-eslint/naming-convention
    interface Matchers<R, T> {
      /**
       * Use .toSucceedAndSatisfy to verify that a Result<T> is a success
       * and that the supplied test function returns true (or void)
       * for the resulting value
       * @param test -
       */
      toSucceedAndSatisfy(test: (value: ResultValueType<T>) => boolean | void): R;
    }
  }
}

function passMessage<T>(received: Result<T>): () => string {
  const expected = 'successful callback';
  const got = [printReceivedResult(received)];
  got.push('  Callback returned true');

  return () =>
    [
      matcherHint(`.not.${matcherName}`, 'result', 'callback'),
      printExpectedResult('success', false, expected),
      ...got
    ].join('\n');
}

function failMessage<T>(received: Result<T>, cbResult: Result<boolean | void>): () => string {
  const expected = 'successful callback';
  const got = [printReceivedResult(received)];

  /* c8 ignore else */
  if (cbResult.isFailure()) {
    got.push(cbResult.message);
  } else if (cbResult.value === false) {
    got.push('  Callback returned false');
  } else if (cbResult.value === undefined) {
    /* c8 ignore else */
    got.push('  Callback was not invoked');
  } else {
    /* c8 ignore next */
    throw new Error('Internal error: toSucceedAndSatisfy.failMessage passed success with true');
  }

  return () =>
    [
      matcherHint(`${matcherName}`, 'result', 'callback'),
      printExpectedResult('success', true, expected),
      ...got
    ].join('\n');
}

export default {
  toSucceedAndSatisfy: function <T>(
    this: jest.MatcherContext,
    received: Result<T>,
    test: (value: T) => boolean | void
  ): jest.CustomMatcherResult {
    // For the normal (not '.not') case, we do not want to capture exceptions
    // so that the IDE can display exactly the line on which the failure case.
    // For the .not case, we want to swallow exceptions or expect failures since
    // we're just testing failure and not the reason.
    const capture = this.isNot;
    const cbResult = predicate(received, test, !!capture);
    const pass = cbResult.isSuccess() && cbResult.value === true;
    if (pass) {
      return { pass: true, message: passMessage(received) };
    }

    return { pass: false, message: failMessage(received, cbResult) };
  }
};
