import { scenarios } from '../../scenarios';

describe('@fgv/testbed scenario registry', () => {
  test('has the expected number of scenarios at B-3 (one scenario registered)', () => {
    expect(Array.isArray(scenarios)).toBe(true);
    expect(scenarios.length).toBe(1);
  });

  test('contains the local-classifier-safety scenario', () => {
    const found = scenarios.find((s) => s.id === 'local-classifier-safety');
    expect(found).toBeDefined();
    expect(found?.category).toBe('ai');
  });
});
