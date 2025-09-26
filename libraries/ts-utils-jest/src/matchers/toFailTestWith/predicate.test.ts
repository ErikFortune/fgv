import { predicate } from './predicate';
import toFail from '../toFail';
import toFailWith from '../toFailWith';
import toSucceed from '../toSucceed';
import toSucceedAndSatisfy from '../toSucceedAndSatisfy';
import toSucceedWith from '../toSucceedWith';

expect.extend({
  ...toFail,
  ...toFailWith,
  ...toSucceed,
  ...toSucceedAndSatisfy,
  ...toSucceedWith
});

describe('toFailTestWith', () => {
  test('returns failure with an empty string for a callback that succeeds', () => {
    expect(predicate(() => {}, 'whatever')).toFailWith('');
  });

  test('returns success with true for a callback that fails with an expected RegExp', () => {
    expect(
      predicate(() => {
        expect('hello').toBe('goodbye');
      }, /expect/i)
    ).toSucceed();
  });

  test('returns success with the returned string for a callback that fails with an expected string', () => {
    expect(
      predicate(() => {
        throw new Error('This is an error');
      }, 'This is an error')
    ).toSucceedWith('This is an error');
  });

  test('returns success with the returned string for a callback that fails with an expected array of strings', () => {
    expect(
      predicate(() => {
        throw new Error('This is an error\n  that spills over to a second line');
      }, ['This is an error', '  that spills over to a second line'])
    ).toSucceedWith(expect.stringMatching(/this is an error[\s\S]*spills/i));
  });

  test('returns success with the returned string for a callback that fails with an expected array of matchers', () => {
    expect(
      predicate(() => {
        throw new Error('This is an error\n  that spills over to a second line');
      }, [expect.stringMatching(/error/i), expect.stringMatching(/spills/i)])
    ).toSucceedWith(expect.stringMatching(/this is an error[\s\S]*spills/i));
  });

  test('returns fail with the returned error message for a callback that fails with an unexpected value', () => {
    expect(
      predicate(() => {
        expect('hello').toBe('goodbye');
      }, /random text/i)
    ).toFailWith(/expect.*[\n\S]*goodbye.*[\s\S]*hello/i);
  });

  test('returns fail with an error if passed an illegal expected value', () => {
    expect(
      predicate(() => {
        throw new Error('1');
      }, 1 as unknown as string)
    ).toFailWith(/unsupported expected value/i);
  });
});
