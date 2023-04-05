import { failWithDetail, succeedWithDetail } from '../../ts-utils';
import matcher from './';
import toFailTestAndMatchSnapshot from '../toFailTestAndMatchSnapshot';

expect.extend({
  ...matcher,
  ...toFailTestAndMatchSnapshot
});

describe('.toFailWithDetail', () => {
  test('passes with a failure result and matching string or RegExp', () => {
    expect(failWithDetail('oops', 'detail')).toFailWithDetail('oops', 'detail');
    expect(failWithDetail('oops', { detail: 'detail' })).toFailWithDetail(/o.*/i, { detail: 'detail' });
  });

  test('fails with a success result', () => {
    expect(succeedWithDetail('hello')).not.toFailWithDetail('hello', 'detail');
  });

  test('fails with a failure result but non-matching string or RegExp, or with a non-matching detail', () => {
    expect(failWithDetail('oops', 'detail')).not.toFailWithDetail('error', 'detail');
    expect(failWithDetail('oops', 'detail')).not.toFailWithDetail(/x.*/i, 'detail');
    expect(failWithDetail('error', 'other detail')).not.toFailWithDetail('error', 'detail');
  });

  test('reports details correctly on a failure due to a success result', () => {
    expect(() => {
      expect(succeedWithDetail('hello')).toFailWithDetail('hello', 'detail');
    }).toFailTestAndMatchSnapshot();
  });

  test('reports details correctly on a failure due to non-matching failure value', () => {
    expect(() => {
      expect(failWithDetail('oops', 'detail')).toFailWithDetail('error', 'detail');
    }).toFailTestAndMatchSnapshot();
  });

  test('reports details correctly on a failure due to non-matching detail value', () => {
    expect(() => {
      expect(failWithDetail('error', 'other detail')).toFailWithDetail('error', 'detail');
    }).toFailTestAndMatchSnapshot();
  });

  test('reports details correctly on a failure with a .not', () => {
    expect(() => {
      expect(failWithDetail('oops', 'detail')).not.toFailWithDetail('oops', 'detail');
    }).toFailTestAndMatchSnapshot();
  });
});
