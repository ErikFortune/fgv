// Copyright (c) 2024 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { Result, fail, captureResult } from '@fgv/ts-utils';

/**
 * Command-line options for the sync-data command
 */
interface ISyncDataCommandOptions {
  force?: boolean;
  target?: string;
  dryRun?: boolean;
}

/**
 * Target packages that receive synced data
 */
interface ISyncTarget {
  readonly name: string;
  readonly path: string;
  readonly destSubdir: string;
}

/**
 * Default source path relative to repo root
 */
const DEFAULT_SOURCE: string = 'data/published/chocolate';

/**
 * Target packages for data sync
 */
const SYNC_TARGETS: ReadonlyArray<ISyncTarget> = [
  { name: 'ts-chocolate', path: 'libraries/ts-chocolate', destSubdir: 'data/published' },
  { name: 'chocolate-cli', path: 'tools/chocolate-cli', destSubdir: 'data/published' },
  { name: 'chocolate-web', path: 'apps/chocolate-web', destSubdir: 'data/published' }
];

/**
 * Finds the repository root by looking for rush.json
 */
function findRepoRoot(): Result<string> {
  let current = process.cwd();
  while (current !== path.dirname(current)) {
    if (fs.existsSync(path.join(current, 'rush.json'))) {
      return captureResult(() => current);
    }
    current = path.dirname(current);
  }
  return fail('Could not find repository root (no rush.json found)');
}

/**
 * Recursively copies a directory
 */
function copyDirectory(src: string, dest: string): Result<number> {
  return captureResult(() => {
    let fileCount = 0;

    if (!fs.existsSync(src)) {
      throw new Error(`Source directory does not exist: ${src}`);
    }

    fs.mkdirSync(dest, { recursive: true });

    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        const subResult = copyDirectory(srcPath, destPath);
        if (subResult.isFailure()) {
          throw new Error(subResult.message);
        }
        fileCount += subResult.value;
      } else if (entry.isFile()) {
        fs.copyFileSync(srcPath, destPath);
        fileCount++;
      }
    }

    return fileCount;
  }).withErrorFormat((e) => `Failed to copy directory: ${e}`);
}

/**
 * Creates the sync-data command.
 * Copies data from data/published/chocolate to target packages.
 */
export function createSyncDataCommand(): Command {
  const cmd = new Command('sync-data');

  cmd
    .description('Sync published chocolate data to target packages')
    .option('--force', 'Overwrite existing data in target packages', false)
    .option('--target <name>', 'Sync to specific target only (ts-chocolate, chocolate-cli, chocolate-web)')
    .option('--dry-run', 'Show what would be done without making changes', false)
    .action((options: ISyncDataCommandOptions) => {
      // Find repo root
      const repoRootResult = findRepoRoot();
      if (repoRootResult.isFailure()) {
        console.error(`Error: ${repoRootResult.message}`);
        process.exit(1);
      }
      const repoRoot = repoRootResult.value;

      const sourceDir = path.join(repoRoot, DEFAULT_SOURCE);

      // Verify source exists
      if (!fs.existsSync(sourceDir)) {
        console.error(`Error: Source directory does not exist: ${sourceDir}`);
        console.error('Run publish-data first to create the published data.');
        process.exit(1);
      }

      // Determine targets
      let targets = [...SYNC_TARGETS];
      if (options.target) {
        const target = SYNC_TARGETS.find((t) => t.name === options.target);
        if (!target) {
          console.error(`Error: Unknown target "${options.target}"`);
          console.error(`Valid targets: ${SYNC_TARGETS.map((t) => t.name).join(', ')}`);
          process.exit(1);
        }
        targets = [target];
      }

      console.log(`Source: ${sourceDir}`);
      if (options.dryRun) {
        console.log('(Dry run - no files will be modified)\n');
      } else {
        console.log('');
      }

      let syncedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      for (const target of targets) {
        const targetDir = path.join(repoRoot, target.path, target.destSubdir);

        // Check if target already exists
        if (fs.existsSync(targetDir) && !options.force) {
          console.log(`  Skipped: ${target.name} (already exists, use --force to overwrite)`);
          skippedCount++;
          continue;
        }

        if (options.dryRun) {
          if (fs.existsSync(targetDir)) {
            console.log(`  Would overwrite: ${target.name} -> ${target.path}/${target.destSubdir}`);
          } else {
            console.log(`  Would sync: ${target.name} -> ${target.path}/${target.destSubdir}`);
          }
          syncedCount++;
        } else {
          // Remove existing if force
          if (fs.existsSync(targetDir) && options.force) {
            fs.rmSync(targetDir, { recursive: true });
          }

          const copyResult = copyDirectory(sourceDir, targetDir);
          if (copyResult.isFailure()) {
            console.error(`  ERROR: ${target.name} - ${copyResult.message}`);
            errorCount++;
            continue;
          }

          console.log(
            `  Synced: ${target.name} (${copyResult.value} files) -> ${target.path}/${target.destSubdir}`
          );
          syncedCount++;
        }
      }

      console.log(`\nCompleted: ${syncedCount} synced, ${skippedCount} skipped, ${errorCount} failed`);
      if (errorCount > 0) {
        process.exit(1);
      }
    });

  return cmd;
}
