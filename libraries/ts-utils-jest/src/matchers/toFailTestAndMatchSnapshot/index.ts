/* eslint-disable @typescript-eslint/no-unused-vars,no-unused-vars */
import { Context, toMatchSnapshot } from 'jest-snapshot';
import { matcherName, predicate } from './predicate';

import { matcherHint } from 'jest-matcher-utils';
import { stripAnsiColors } from '../../utils/colorHelpers';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars,  @typescript-eslint/naming-convention
    interface Matchers<R, T> {
      /**
       * Use .toFailTestWith to test a custom matcher by
       * verifying that a test case fails as expected and
       * reports an error matching a stored snapshot.
       */
      toFailTestAndMatchSnapshot<T>(): R;
    }
  }
}

export default {
  toFailTestAndMatchSnapshot: function <T>(
    this: jest.MatcherContext,
    cb: () => void
  ): jest.CustomMatcherResult {
    const context = this as unknown as Context;
    const cbResult = predicate(cb);
    if (cbResult.isFailure()) {
      return {
        pass: false,
        message: (): string => {
          return [
            matcherHint(`${matcherName}`, 'callback'),
            '  Expected: Callback to fail with an error that matches snapshot',
            '  Received: Callback succeeded'
          ].join('\n');
        }
      };
    }
    return toMatchSnapshot.call(
      context,
      stripAnsiColors(cbResult.value),
      'toFailTestAndMatchSnapshot'
    ) as jest.CustomMatcherResult;
  }
};
