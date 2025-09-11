import matcher from './';
import toFailTestAndMatchSnapshot from '../toFailTestAndMatchSnapshot';

expect.extend({
  ...matcher,
  ...toFailTestAndMatchSnapshot
});

describe('.toFailTestWith', () => {
  test('fails for a callback that succeeds', () => {
    expect(() => {}).not.toFailTestWith('whatever');
  });

  test('passes for a callback that fails with an error matching a supplied RegExp', () => {
    expect(() => {
      expect('hello').toEqual('goodbye');
    }).toFailTestWith(/expect/i);
  });

  test('passes for a callback that fails with an error matching a supplied string', () => {
    expect(() => {
      throw new Error('This is an error');
    }).toFailTestWith('This is an error');
  });

  test('passes for a callback that fails with an error matching a supplied array of strings', () => {
    expect(() => {
      throw new Error('This is an error\n  that spills over to a second line');
    }).toFailTestWith(['This is an error', '  that spills over to a second line']);
  });

  test('passes for a callback that fails with an error matching a supplied array of matchers', () => {
    expect(() => {
      throw new Error('This is an error\n  that spills over to a second line');
    }).toFailTestWith([expect.stringMatching(/error/i), expect.stringMatching(/spills/i)]);
  });

  test('fails for a callback that fails with an unexpected value', () => {
    expect(() => {
      expect('hello').toBe('goodbye');
    }).not.toFailTestWith(/random text/i);
  });

  test('logs failure correctly when callback succeeds', () => {
    expect(() => {
      expect(() => {}).toFailTestWith('whatever');
    }).toFailTestAndMatchSnapshot();
  });

  test('logs failure correctly when callback returns an unexpected value', () => {
    expect(() => {
      expect(() => {
        expect('hello').toBe('goodbye');
      }).toFailTestWith(/random text/i);
    }).toFailTestAndMatchSnapshot();
  });

  test('logs failure correctly when callback fails with .not', () => {
    expect(() => {
      expect(() => {
        expect(true).toBe(false);
      }).not.toFailTestWith(/expect/i);
    }).toFailTestAndMatchSnapshot();
  });
});
