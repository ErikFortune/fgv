import toFailTestAndMatchSnapshot from '../toFailTestAndMatchSnapshot';
import matcher from './';

expect.extend({
  ...matcher,
  ...toFailTestAndMatchSnapshot
});

describe('.toHaveBeenCalledWithArgumentsMatching', () => {
  test('succeeds when arguments match', () => {
    const fn = jest.fn();
    fn('arg1', 'arg2');
    expect(fn).toHaveBeenCalledWithArgumentsMatching(['arg1', 'arg2']);
  });

  test('succeeds using an expect. matcher', () => {
    const fn = jest.fn();
    fn('arg1', 'arg2');
    expect(fn).toHaveBeenCalledWithArgumentsMatching(expect.arrayContaining(['arg2']));
  });

  test('fails if no matching call is found', () => {
    const fn = jest.fn();
    fn();
    expect(fn).not.toHaveBeenCalledWithArgumentsMatching(['arg1']);
  });

  test('fails if no function has not been called', () => {
    expect(jest.fn()).not.toHaveBeenCalledWithArgumentsMatching([]);
  });

  test('reports a helpful message if a call is not matched', () => {
    const fn = jest.fn();
    fn('call1');
    fn('call2');
    fn('call3');
    fn('call4');
    fn('call5');
    fn('call6');
    expect(() => {
      expect(fn).toHaveBeenCalledWithArgumentsMatching(['call7']);
    }).toThrowErrorMatchingSnapshot();
  });

  test('reports a helpful message if function was not called', () => {
    const fn = jest.fn();
    expect(() => {
      expect(fn).toHaveBeenCalledWithArgumentsMatching(['call7']);
    }).toThrowErrorMatchingSnapshot();
  });

  describe('reports a helpful message if a .not test fails', () => {
    test('with few calls', () => {
      const fn = jest.fn();
      fn('arg1');
      expect(() => {
        expect(fn).not.toHaveBeenCalledWithArgumentsMatching([expect.any(String)]);
      }).toThrowErrorMatchingSnapshot();
    });

    describe('with many calls', () => {
      let fn: jest.Mock;
      beforeEach(() => {
        fn = jest.fn();
        fn('arg0');
        fn('arg1');
        fn('arg2');
        fn('arg3');
        fn('arg4');
        fn('arg5');
        fn('arg6');
      });

      test.each([
        ['for the first call', ['arg0']],
        ['for the second call', [expect.stringMatching(/1/)]],
        ['for a call in the middle', ['arg3']],
        ['for the second-to-last-call', ['arg5']],
        ['for the last call', ['arg6']]
      ])('%p', (__desc, args) => {
        expect(() => {
          expect(fn).not.toHaveBeenCalledWithArgumentsMatching(args);
        }).toThrowErrorMatchingSnapshot();
      });
    });
  });

  test.each([
    ['not a mock function', () => 'hello'],
    ['an object', {}],
    ['null', null]
  ])('throws if argument is %p', (__desc, arg) => {
    expect(() => {
      expect(arg).toHaveBeenCalledWithArgumentsMatching([]);
    }).toThrowErrorMatchingSnapshot();
  });
});
