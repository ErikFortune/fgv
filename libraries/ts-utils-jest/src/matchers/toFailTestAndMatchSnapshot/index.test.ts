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
    expect(() => {}).not.toFailTestAndMatchSnapshot();
  });

  test('logs details correctly for a failed result', () => {
    expect(() => {
      expect(() => {}).toFailTestAndMatchSnapshot();
    }).toFailTestAndMatchSnapshot();
  });
});
