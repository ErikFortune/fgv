/// <reference types="jest"/>

// eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars
import { ResultDetailType, ResultValueType } from '@fgv/ts-utils';

/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface Matchers<R, T> {
      /**
       * Use .toSucceed to verify that a Result\<T\> is a success
       */
      toSucceed(): R;

      /**
       * Use .toSucceedWith to verify that a Result\<T\> is a success
       * and that the result value matches the supplied value
       * @param expected -
       */
      toSucceedWith(expected: ResultValueType<T> | RegExp): R;

      /**
       * Use .toSucceedWithDetail to verify that a DetailedResult\<T, TD\> is
       * a success and that the result value and detail matches the supplied
       * values
       * @param expected -
       * @param detail -
       */
      toSucceedWithDetail(expected: ResultValueType<T>, detail: ResultDetailType<T> | undefined): R;

      /**
       * Use .toSucceedAndSatisfy to verify that a Result\<T\> is a success
       * and that the supplied test function returns true (or void)
       * for the resulting value
       * @param test -
       */
      toSucceedAndSatisfy(test: (value: ResultValueType<T>) => boolean | void): R;

      /**
       * Use .toSucceedAndMatchInlineSnapshot to verify that a Result\<T\> is a success
       * and that the result value matches an inline snapshot
       */
      toSucceedAndMatchInlineSnapshot(snapshot: string | undefined): R;

      /**
       * Use .toSucceedAndMatchSnapshot to verify that a Result\<T\> is a success
       * and that the result value matches a stored snapshot
       */
      toSucceedAndMatchSnapshot(): R;

      /**
       * Use .toFail to verify that a Result\<T\> is a failure
       */
      toFail(): R;

      /**
       * Use .toFailWith to verify that a Result\<T\> is a failure
       * that matches a supplied string, RegExp or undefined value
       * @param message -
       */
      toFailWith(expected: string | RegExp | undefined): R;

      /**
       * Use .toFailWithDetail to verify that a DetailedResult\<T\> is
       * a failure that matches both a supplied expected failure value
       * (string, RegExp or undefined) and a supplied failure detail.
       * @param message -
       * @param detail -
       */
      toFailWithDetail(message: string | RegExp | undefined, detail: ResultDetailType<T>): R;

      /**
       * Use .toFailTest to test a custom matcher by
       * verifying that a test case fails.
       */
      toFailTest(): R;

      /**
       * Use .toFailTestWith to test a custom matcher by
       * verifying that a test case fails as expected and
       * reports an error matching a stored snapshot.
       */
      toFailTestAndMatchSnapshot(): R;

      /**
       * Use .toFailTestWith to test a custom matcher by
       * verifying that a test case fails as expected and
       * reports an error matching a supplied value.
       * @param expected -
       */
      toFailTestWith(expected: string | string[] | RegExp): R;

      /**
       * Use .toSucceedWith to verify that a Result\<T\> is a success
       * and that the result value matches the supplied value
       * @param expected -
       */
      toHaveBeenCalledWithArgumentsMatching(expected: unknown): R;
    }
  }
}
