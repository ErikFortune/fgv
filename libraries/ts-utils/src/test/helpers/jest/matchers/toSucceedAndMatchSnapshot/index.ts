/* eslint-disable @typescript-eslint/no-unused-vars,no-unused-vars */
import { matcherHint } from 'jest-matcher-utils';
import { Context, toMatchSnapshot } from 'jest-snapshot';
import { Result } from '../../../../../index';
import { printReceivedResult } from '../../utils/matcherHelpers';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-types, @typescript-eslint/naming-convention
    interface Matchers<R, T> {
      /**
       * Use .toSucceedAndMatchSnapshot to verify that a Result<T> is a success
       * and that the result value matches a stored snapshot
       */
      toSucceedAndMatchSnapshot<T>(): R;
    }
  }
}

const matcherName: string = 'toSucceedAndMatchSnapshot';

export default {
  toSucceedAndMatchSnapshot: function <T>(
    this: jest.MatcherContext,
    received: Result<T>
  ): jest.CustomMatcherResult {
    const context = this as unknown as Context;
    if (received.isFailure()) {
      return {
        pass: false,
        message: (): string => {
          return [
            matcherHint(`${matcherName}`, 'callback'),
            'Expected:\n  Callback to succeed with a result that matches the snapshot',
            printReceivedResult(received)
          ].join('\n');
        }
      };
    }
    return toMatchSnapshot.call(
      context,
      received.value,
      'toSucceedAndMatchSnapshot'
    ) as jest.CustomMatcherResult;
  }
};
