import { fail, succeed } from '../../ts-utils';
import matcher from './';
import toFailTestAndMatchSnapshot from '../toFailTestAndMatchSnapshot';

expect.extend({
  ...matcher,
  ...toFailTestAndMatchSnapshot
});

describe('.toFailWith', () => {
  test('passes with a failure result and matching string or RegExp', () => {
    expect(fail('oops')).toFailWith('oops');
    expect(fail('oops')).toFailWith(/o.*/i);
  });

  test('fails with a success result', () => {
    expect(succeed('hello')).not.toFailWith('hello');
  });

  test('fails with a failure result but non-matching string or RegExp', () => {
    expect(fail('oops')).not.toFailWith('error');
    expect(fail('oops')).not.toFailWith(/x.*/i);
  });

  test('reports details correctly on a failure due to a success result', () => {
    expect(() => {
      expect(succeed('hello')).toFailWith('hello');
    }).toFailTestAndMatchSnapshot();
  });

  test('reports details correctly on a failure due to non-matching failure value', () => {
    expect(() => {
      expect(fail('oops')).toFailWith('error');
    }).toFailTestAndMatchSnapshot();
  });

  test('reports details correctly on a failure with a .not', () => {
    expect(() => {
      expect(fail('oops')).not.toFailWith('oops');
    }).toFailTestAndMatchSnapshot();
  });
});
