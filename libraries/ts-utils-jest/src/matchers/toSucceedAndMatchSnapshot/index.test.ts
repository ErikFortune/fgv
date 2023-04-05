import { fail, succeed } from '../../ts-utils';
import matcher from './';
import toFailTestAndMatchSnapshot from '../toFailTestAndMatchSnapshot';

expect.extend({
  ...matcher,
  ...toFailTestAndMatchSnapshot
});

describe('.toSucceedAndMatchSnapshot', () => {
  test('passes for a success result that matches the snapshot', () => {
    expect(
      succeed({
        someField: 'this is a value',
        nestedObject: {
          anArray: ['element 1', 'element 2']
        }
      })
    ).toSucceedAndMatchSnapshot();
  });

  test('fails for a failure result', () => {
    expect(fail('oops')).not.toSucceedAndMatchSnapshot();
  });

  test('logs details correctly for a failed result', () => {
    expect(() => {
      expect(fail('oopsy')).toSucceedAndMatchSnapshot();
    }).toFailTestAndMatchSnapshot();

    expect(() => {
      expect(succeed({ now: new Date().toISOString() })).not.toSucceedAndMatchSnapshot();
    }).toFailTestAndMatchSnapshot();
  });
});
