import { fail, succeed } from '../../ts-utils';
import { predicate } from './predicate';

describe('toSucceed', () => {
  test('returns true for a success result', () => {
    expect(predicate(succeed('hello'))).toBe(true);
  });

  test('returns false for a failure result', () => {
    expect(predicate(fail('oops'))).toBe(false);
  });
});
