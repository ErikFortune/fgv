import { scenarios } from '../../scenarios';

describe('@fgv/testbed scenario registry', () => {
  test('is an empty readonly array at B-1', () => {
    expect(Array.isArray(scenarios)).toBe(true);
    expect(scenarios.length).toBe(0);
  });
});
