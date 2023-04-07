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
    ).toSucceedAndMatchInlineSnapshot(`
      Object {
        "nestedObject": Object {
          "anArray": Array [
            "element 1",
            "element 2",
          ],
        },
        "someField": "this is a value",
      }
    `);
  });

  test('fails for a failure result', () => {
    expect(fail('oops')).not.toSucceedAndMatchInlineSnapshot('oops');
  });

  test('logs details correctly for a failed result', () => {
    expect(() => {
      expect(fail('oopsy')).toSucceedAndMatchInlineSnapshot('oopsy');
    }).toFailTestAndMatchSnapshot();

    expect(() => {
      expect(succeed({ now: new Date().toISOString() })).not.toSucceedAndMatchInlineSnapshot(
        '{ now: today }'
      );
    }).toFailTestAndMatchSnapshot();
  });
});
