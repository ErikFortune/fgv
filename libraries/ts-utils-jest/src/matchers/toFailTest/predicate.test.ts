import { predicate } from './predicate';

describe('toFailTest', () => {
  test('returns true for a callback that fails', () => {
    expect(
      predicate(() => {
        expect(true).toBe(false);
      })
    ).toBe(true);
  });

  test('returns false for a callback that succeeds', () => {
    expect(predicate(() => {})).toBe(false);
  });
});
