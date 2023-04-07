import { predicate } from './predicate';

describe('toHaveBeenCalledWithArgumentsMatching', () => {
  let fn: jest.Mock<unknown>;

  beforeEach(() => {
    fn = jest.fn();
    fn('arg1', 'arg2');
    fn('call2');
    fn('call3');
    fn();
  });

  test('returns matching args if some call matches', () => {
    expect(predicate(fn, ['arg1', 'arg2'])).toEqual({ index: 0, arguments: ['arg1', 'arg2'] });
    expect(predicate(fn, ['call3'])).toEqual({ index: 2, arguments: ['call3'] });
  });

  test('matches matching args for a call with no parameters', () => {
    expect(predicate(fn, [])).toEqual({ index: 3, arguments: [] });
  });

  test('returns matching args if expected is an asymmetric matcher', () => {
    expect(predicate(fn, expect.arrayContaining(['arg1']))).toEqual({
      index: 0,
      arguments: ['arg1', 'arg2']
    });
  });

  test('returns undefined if no call matches', () => {
    expect(predicate(fn, ['arg1'])).toBeUndefined();
    expect(predicate(fn, ['call2', 'arg1'])).toBeUndefined();
  });

  test('returns undefined if the mock has not been called', () => {
    expect(predicate(jest.fn(), [])).toBeUndefined();
  });
});
