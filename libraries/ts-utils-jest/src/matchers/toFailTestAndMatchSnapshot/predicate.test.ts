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

describe('toFailTestAndMatchSnapshot', () => {
  test('returns failure for a callback that succeeds', () => {
    expect(predicate(() => {})).toFail();
  });

  test('returns success with the reported error for a callback that fails', () => {
    expect(
      predicate(() => {
        expect('hello').toBe('goodbye');
      })
    ).toSucceedWith(expect.stringMatching(/expect.*[\s\S].*goodbye.*[\s\S].*hello/i));
  });
});
