import CLI from './cli';
import IDE from './ide';

describe('resolver tests', () => {
  test('CLI resolver roundtrips correctly', () => {
    expect(
      CLI.resolveTestPath(CLI.resolveSnapshotPath(CLI.testPathForConsistencyCheck, '.snap'), '.snap')
    ).toEqual(CLI.testPathForConsistencyCheck);
  });

  test('CLI resolver inserts the string cli somewhere in the path', () => {
    expect(CLI.testPathForConsistencyCheck).not.toMatch(/cli/i);
    expect(CLI.resolveSnapshotPath(CLI.testPathForConsistencyCheck, '.snap')).toMatch(/cli/i);
  });

  test('IDE resolver roundtrips correctly', () => {
    expect(
      IDE.resolveTestPath(IDE.resolveSnapshotPath(IDE.testPathForConsistencyCheck, '.snap'), '.snap')
    ).toEqual(IDE.testPathForConsistencyCheck);
  });

  test('IDE resolver inserts the string ide somewhere in the path', () => {
    expect(IDE.testPathForConsistencyCheck).not.toMatch(/ide/i);
    expect(IDE.resolveSnapshotPath(IDE.testPathForConsistencyCheck, '.snap')).toMatch(/ide/i);
  });
});
