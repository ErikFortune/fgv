import './index';

import { fail, failWithDetail, succeed, succeedWithDetail } from '@fgv/ts-utils';

describe('verify matchers accessibility', () => {
  test('toFail exists and works', () => {
    expect(fail('oops')).toFail();
    expect(succeed('hi')).not.toFail();
  });

  test('toFailWith exists and works', () => {
    expect(fail('oops')).toFailWith('oops');
  });

  test('toFailWithDetail exists and works', () => {
    expect(failWithDetail<string, string>('oops', 'detail')).toFailWithDetail('oops', 'detail');
  });

  test('toSucceed exists and works', () => {
    expect(succeed('howdy')).toSucceed();
  });

  test('toSucceedWith exists and works', () => {
    expect(succeed('howdy')).toSucceedWith('howdy');
  });

  test('toSucceedWithDetail exists and works', () => {
    expect(succeedWithDetail('howdy', 'detail')).toSucceedWithDetail('howdy', 'detail');
  });

  test('toSucceedAndSatisfy exists and works', () => {
    expect(succeed('howdy')).toSucceedAndSatisfy((v: string) => {
      expect(v).toBe('howdy');
      return true;
    });
  });

  test('toSucceedAndMatchSnapshot exists and works', () => {
    expect(
      succeed({
        field: 'field',
        child: {
          values: [{ number: 1 }, { number: 2 }]
        }
      })
    ).toSucceedAndMatchSnapshot();
  });

  test('toSucceedAndMatchInlineSnapshot exists and works', () => {
    expect(
      succeed({
        field: 'field',
        child: {
          values: [{ number: 1 }, { number: 2 }]
        }
      })
    ).toSucceedAndMatchInlineSnapshot(`
            {
              "child": {
                "values": [
                  {
                    "number": 1,
                  },
                  {
                    "number": 2,
                  },
                ],
              },
              "field": "field",
            }
        `);
  });

  test('toFailTest exists and works', () => {
    expect(() => {
      expect(true).toBe(false);
    }).toFailTest();
  });

  test('toFailTestAndMatchSnapshot exists and works', () => {
    expect(() => {
      expect(true).toBe(false);
    }).toFailTestAndMatchSnapshot();
  });

  test('toFailTestWith exists and works', () => {
    expect(() => {
      expect(true).toBe(false);
    }).toFailTestWith(/expect.*[\s\S].*false.*[\s\S].*true/i);
  });

  test('toHaveBeenCalledWithArgumentsMatching exists and works', () => {
    const fn = jest.fn();
    fn('hello');
    expect(fn).toHaveBeenCalledWithArgumentsMatching(['hello']);
  });
});
