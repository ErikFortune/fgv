import * as Resolver from '../utils/snapshotResolver';

const CLI_SNAPSHOT_FOLDER: string = '__cli__';

function resolveSnapshotPath(testPath: string, ext: string): string {
  return Resolver.resolveSnapshotPath(testPath, ext, CLI_SNAPSHOT_FOLDER);
}

function resolveTestPath(snapshotPath: string, ext: string): string {
  return Resolver.resolveTestPath(snapshotPath, ext);
}

const testPathForConsistencyCheck: string = Resolver.testPathForConsistencyCheck;

module.exports = {
  resolveSnapshotPath,
  resolveTestPath,
  testPathForConsistencyCheck
};

export default module.exports;
