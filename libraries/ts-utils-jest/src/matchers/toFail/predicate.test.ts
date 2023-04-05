import { fail, succeed } from '../../ts-utils';
import { predicate } from './predicate';

describe('toFail', () => {
  test('returns true with a failure result', () => {
    expect(predicate(fail('oops'))).toBe(true);
  });

  test('returns false with a success result', () => {
    expect(predicate(succeed('hello'))).toBe(false);
  });
});
