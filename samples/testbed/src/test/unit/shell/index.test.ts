import * as Shell from '../../../shell';

describe('@fgv/testbed shell barrel', () => {
  test('re-exports the resolveSecret helper', () => {
    expect(typeof Shell.resolveSecret).toBe('function');
  });
});
