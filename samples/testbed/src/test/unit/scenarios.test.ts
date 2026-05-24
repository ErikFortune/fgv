import { scenarios } from '../../scenarios';

describe('@fgv/testbed scenario registry', () => {
  test('registry exposes the expected scenario ids (snapshot)', () => {
    expect(Array.isArray(scenarios)).toBe(true);
    // Snapshot the id set rather than asserting an exact count: this fails loudly
    // when the registry changes but is trivially repaired with `--updateSnapshot`
    // when the change is expected (e.g. a new scenario landing).
    expect(scenarios.map((s) => s.id)).toMatchSnapshot();
  });

  test('contains the local-classifier-safety scenario', () => {
    const found = scenarios.find((s) => s.id === 'local-classifier-safety');
    expect(found).toBeDefined();
    expect(found?.category).toBe('ai');
  });
});
