import { fail, succeed } from '../../ts-utils';
import matcher from './';
import toFailTestAndMatchSnapshot from '../toFailTestAndMatchSnapshot';

expect.extend({
  ...matcher,
  ...toFailTestAndMatchSnapshot
});

describe('.toSucceed', () => {
  test('passes with a success result', () => {
    expect(succeed('hello')).toSucceed();
  });

  test('fails with a failure result', () => {
    expect(fail('oops')).not.toSucceed();
  });

  test('reports details for a failed test', () => {
    expect(() => {
      expect(fail('oops')).toSucceed();
    }).toFailTestAndMatchSnapshot();
  });

  test('reports details for a failed .not test', () => {
    expect(() => {
      expect(succeed('hello')).not.toSucceed();
    }).toFailTestAndMatchSnapshot();
  });
});
