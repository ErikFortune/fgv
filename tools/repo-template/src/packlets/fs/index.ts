/**
 * File system and shell execution helpers.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync, ExecSyncOptions } from 'child_process';

/**
 * Directories to exclude when copying shared packages.
 */
const EXCLUDED_DIRS: Set<string> = new Set([
  'node_modules',
  'lib',
  'dist',
  '.heft',
  'temp',
  'coverage',
  'rush-logs'
]);

/**
 * Copy a single file, creating parent directories as needed.
 */
export function copyFile(src: string, dest: string): void {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

/**
 * Copy a directory recursively, excluding build artifacts.
 */
export function copyPackage(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, {
    recursive: true,
    filter: (source: string) => {
      const basename = path.basename(source);
      return !EXCLUDED_DIRS.has(basename);
    }
  });
}

/**
 * Compare two files for equality.
 * Returns true if files are identical.
 */
export function filesAreEqual(pathA: string, pathB: string): boolean {
  if (!fs.existsSync(pathA) || !fs.existsSync(pathB)) {
    return false;
  }
  const a = fs.readFileSync(pathA);
  const b = fs.readFileSync(pathB);
  return Buffer.compare(a, b) === 0;
}

/**
 * Execute a shell command, returning stdout.
 */
export function exec(command: string, options?: ExecSyncOptions): string {
  const result = execSync(command, {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
    ...options
  });
  return (result as string).trim();
}

/**
 * Execute a shell command, inheriting stdio (output goes to terminal).
 */
export function execInherit(command: string, options?: ExecSyncOptions): void {
  execSync(command, {
    stdio: 'inherit',
    ...options
  });
}

/**
 * Try to get the current git commit hash from a directory.
 * Returns empty string if not a git repo or git is not available.
 */
export function getGitCommit(dir: string): string {
  try {
    return exec('git rev-parse HEAD', { cwd: dir });
  } catch {
    return '';
  }
}

/**
 * Try to get the git remote URL from a directory.
 */
export function getGitRemoteUrl(dir: string): string {
  try {
    return exec('git remote get-url origin', { cwd: dir });
  } catch {
    return 'local';
  }
}

/**
 * Auto-detect the fgv source repository root by walking up from a starting directory,
 * looking for a rush.json that belongs to the fgv repo.
 */
export function detectSourceDir(startDir: string): string | undefined {
  let dir = path.resolve(startDir);
  const root = path.parse(dir).root;

  while (dir !== root) {
    const rushJsonPath = path.join(dir, 'rush.json');
    if (fs.existsSync(rushJsonPath)) {
      // Verify it looks like the fgv repo by checking for the template tool
      const manifestPath = path.join(dir, 'tools', 'repo-template', 'sync-manifest.json');
      if (fs.existsSync(manifestPath)) {
        return dir;
      }
    }
    dir = path.dirname(dir);
  }
  return undefined;
}
