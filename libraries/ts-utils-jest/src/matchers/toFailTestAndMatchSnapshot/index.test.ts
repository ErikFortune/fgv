import matcher from './';

expect.extend({
  ...matcher
});

describe('.toFailTestAndMatchSnapshot', () => {
  test('passes for a test that fails with a result matching the snapshot', () => {
    expect(() => {
      expect(true).toBe(false);
    }).toFailTestAndMatchSnapshot();
  });

  test('fails for a test that does not fail', () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    expect(() => {}).not.toFailTestAndMatchSnapshot();
  });

  test('logs details correctly for a failed result', () => {
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      expect(() => {}).toFailTestAndMatchSnapshot();
    }).toFailTestAndMatchSnapshot();
  });
});
