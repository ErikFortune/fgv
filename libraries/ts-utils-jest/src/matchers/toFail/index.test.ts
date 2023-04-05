import { fail, succeed } from '../../ts-utils';
import matcher from './';
import toFailTestAndMatchSnapshot from '../toFailTestAndMatchSnapshot';

expect.extend({
  ...matcher,
  ...toFailTestAndMatchSnapshot
});

describe('.toFail', () => {
  test('passes with a failure result', () => {
    expect(fail('oops')).toFail();
  });

  test('fails with a success result', () => {
    expect(succeed('hello')).not.toFail();
  });

  test('reports details for a failed test', () => {
    expect(() => {
      expect(succeed('hello')).toFail();
    }).toFailTestAndMatchSnapshot();
  });

  test('reports details for a failed test with .not', () => {
    expect(() => {
      expect(fail('oops')).not.toFail();
    }).toFailTestAndMatchSnapshot();
  });
});
