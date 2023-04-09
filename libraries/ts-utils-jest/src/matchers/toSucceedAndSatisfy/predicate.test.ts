import { fail, succeed } from '../../ts-utils';
import toFailWith from '../toFailWith';
import toSucceedWith from '../toSucceedWith';
import { predicate } from './predicate';

expect.extend({
  ...toSucceedWith,
  ...toFailWith
});

describe('toSucceedAndSatisfy', () => {
  test('succeeds with true for a successful result value and a callback that passes', () => {
    expect(predicate(succeed('hello'), (value: string) => value === 'hello', true)).toSucceedWith(true);
  });

  test('succeeds with true for a successful result value and a callback with no return value', () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    expect(predicate(succeed('hello'), () => {}, true)).toSucceedWith(true);
  });

  test('succeeds with false for a successful result value but a callback that fails', () => {
    expect(predicate(succeed('hello'), (value: string) => value !== 'hello', true)).toSucceedWith(false);
  });

  test('succeeds with undefined for a failure result', () => {
    expect(predicate(fail<string>('oops'), (value: string) => value === 'oops', true)).toSucceedWith(
      undefined
    );
  });

  test('fails and propagates the error message if the callback throws', () => {
    expect(
      predicate(
        succeed('hello'),
        (__v: string) => {
          throw new Error('ERROR THROWN');
        },
        true
      )
    ).toFailWith(/ERROR THROWN/);
  });

  test('fails and propagates the error message if the callback contains a failing expect clause', () => {
    expect(
      predicate(
        succeed('hello'),
        (value: string) => {
          expect(value).toBe('goodbye');
          return true;
        },
        true
      )
    ).toFailWith(/expect/i);
  });
});
