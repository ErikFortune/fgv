import { fail, succeed } from '../../ts-utils';
import { predicate } from './predicate';

describe('toFailWith', () => {
  test('returns true for a failure result and matching string, RegExp or undefined', () => {
    expect(predicate(fail('oops'), 'oops')).toBe(true);
    expect(predicate(fail('oops'), /o.*/i)).toBe(true);
    expect(predicate(fail(undefined as unknown as string), undefined)).toBe(true);
  });

  test('returns false for a success result', () => {
    expect(predicate(succeed('hello'), 'hello')).toBe(false);
  });

  test('returns false for a failure result but non-matching string or RegExp', () => {
    expect(predicate(fail('oops'), 'error')).toBe(false);
    expect(predicate(fail('oops'), /x.*/i)).toBe(false);
  });
});
