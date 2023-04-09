import matcher from './';
import toFailTestAndMatchSnapshot from '../toFailTestAndMatchSnapshot';

expect.extend({
  ...matcher,
  ...toFailTestAndMatchSnapshot
});

describe('.toFailTest', () => {
  test('passes for a callback that fails', () => {
    expect(() => {
      expect(true).toBe(false);
    }).toFailTest();
  });

  test('fails for a callback that succeeds', () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    expect(() => {}).not.toFailTest();
  });

  test('logs details correctly for a failed result', () => {
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      expect(() => {}).toFailTest();
    }).toFailTestAndMatchSnapshot();
  });

  test('logs details correctly for a failed .not result', () => {
    expect(() => {
      expect(() => {
        expect(true).toBe(false);
      }).not.toFailTest();
    }).toFailTestAndMatchSnapshot();
  });
});
