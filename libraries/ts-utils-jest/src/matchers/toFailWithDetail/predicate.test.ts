import { failWithDetail, succeedWithDetail } from '../../ts-utils';
import { predicate } from './predicate';

describe('toFailWith', () => {
  test('returns true for a failure result and matching string, RegExp or undefined and a matching detail', () => {
    expect(predicate(failWithDetail('oops', 'detail'), 'oops', 'detail')).toBe(true);
    expect(predicate(failWithDetail('oops', { detail: 'detail' }), /o.*/i, { detail: 'detail' })).toBe(true);
    expect(predicate(failWithDetail(undefined as unknown as string, 'detail'), undefined, 'detail')).toBe(
      true
    );
  });

  test('returns true for a failure result and matching string, RegExp or undefined and a matching detail', () => {
    expect(predicate(failWithDetail('oops', 'detail'), 'oops', 'detail')).toBe(true);
    expect(predicate(failWithDetail('oops', { detail: 'detail' }), /o.*/i, { detail: 'detail' })).toBe(true);
    expect(predicate(failWithDetail(undefined as unknown as string, 'detail'), undefined, 'detail')).toBe(
      true
    );
  });

  test('returns false for a success result', () => {
    expect(predicate(succeedWithDetail('hello'), 'hello', 'detail')).toBe(false);
  });

  test('returns false for a failure result but non-matching string or RegExp', () => {
    expect(predicate(failWithDetail('oops', 'detail'), 'error', 'detail')).toBe(false);
    expect(predicate(failWithDetail('oops', 'detail'), /x.*/i, 'detail')).toBe(false);
    expect(predicate(failWithDetail('oops', 'detail'), undefined, 'detail')).toBe(false);
  });

  test('returns false for a failure result and matching string, RegExp or undefined but with a mismatched detail', () => {
    expect(predicate(failWithDetail('oops', 'other detail'), 'oops', 'detail')).toBe(false);
    expect(predicate(failWithDetail('oops', { detail: 'other detail' }), /o.*/i, { detail: 'detail' })).toBe(
      false
    );
    expect(
      predicate(failWithDetail(undefined as unknown as string, 'other detail'), undefined, 'detail')
    ).toBe(false);
  });
});
