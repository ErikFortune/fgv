import { fail, succeed } from '../../ts-utils';
import toFailTestAndMatchSnapshot from '../toFailTestAndMatchSnapshot';
import matcher from './';

expect.extend({
  ...matcher,
  ...toFailTestAndMatchSnapshot
});

describe('.toSucceedAndSatisfy', () => {
  test('passes with a success value and a callback that returns true', () => {
    expect(succeed('hello')).toSucceedAndSatisfy((value) => value === 'hello');
  });

  test('passes with a success value and a callback with no return', () => {
    expect(succeed('hello')).toSucceedAndSatisfy(() => {});
  });

  test('fails with a success value but a callback that returns false', () => {
    expect(succeed('hello')).not.toSucceedAndSatisfy((value: string) => value !== 'hello');
  });

  test('fails with a success value but a callback that fails an expectation', () => {
    expect(succeed('hello')).not.toSucceedAndSatisfy((value) => {
      expect(value).toBe('goodbye');
      return true;
    });
  });

  test('fails with a success value but a callback that throws an exception', () => {
    expect(succeed('hello')).not.toSucceedAndSatisfy((__value) => {
      throw new Error('UH OH AN ERROR');
    });
  });

  test('fails with a failure value', () => {
    expect(fail<string>('oops')).not.toSucceedAndSatisfy((value: string) => value === 'oops');
  });

  test('reports details when callback returns false', () => {
    expect(() => {
      expect(succeed('hello')).toSucceedAndSatisfy((value: string) => value !== 'hello');
    }).toFailTestAndMatchSnapshot();
  });

  test('reports details when callback fails an expectation', () => {
    expect(() => {
      expect(succeed('hello')).toSucceedAndSatisfy((value: string) => {
        expect(value).toBe('goodbye');
        return true;
      });
    }).toFailTestAndMatchSnapshot();
  });

  test('reports details when callback throws an exception', () => {
    expect(() => {
      expect(succeed('hello')).toSucceedAndSatisfy((__value: string) => {
        throw new Error('UH OH AN ERROR');
      });
    }).toFailTestAndMatchSnapshot();
  });

  test('reports details when received is a failure result', () => {
    expect(() => {
      expect(fail<string>('oops')).toSucceedAndSatisfy((value) => value === 'oops');
    }).toFailTestAndMatchSnapshot();
  });

  test('reports details with success and .not', () => {
    expect(() => {
      expect(succeed('hello')).not.toSucceedAndSatisfy((value: string) => value === 'hello');
    }).toFailTestAndMatchSnapshot();
  });
});
