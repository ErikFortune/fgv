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
 * Command-line options for the clean-data command
 */
interface ICleanDataCommandOptions {
  all?: boolean;
  dryRun?: boolean;
}

/**
 * Target packages that have synced data
 */
interface ICleanTarget {
  readonly name: string;
  readonly path: string;
  readonly destSubdir: string;
  readonly includeByDefault: boolean;
}

/**
 * Target packages for data cleanup
 */
const CLEAN_TARGETS: ReadonlyArray<ICleanTarget> = [
  {
    name: 'chocolate-cli',
    path: 'tools/chocolate-cli',
    destSubdir: 'data/published',
    includeByDefault: true
  },
  { name: 'chocolate-web', path: 'apps/chocolate-web', destSubdir: 'data/published', includeByDefault: true },
  {
    name: 'ts-chocolate',
    path: 'libraries/ts-chocolate',
    destSubdir: 'data/published',
    includeByDefault: false
  }
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
 * Creates the clean-data command.
 * Removes synced data from target packages.
 */
export function createCleanDataCommand(): Command {
  const cmd = new Command('clean-data');

  cmd
    .description('Remove synced chocolate data from target packages')
    .option('--all', 'Also clean ts-chocolate library (normally excluded)', false)
    .option('--dry-run', 'Show what would be done without making changes', false)
    .action((options: ICleanDataCommandOptions) => {
      // Find repo root
      const repoRootResult = findRepoRoot();
      if (repoRootResult.isFailure()) {
        console.error(`Error: ${repoRootResult.message}`);
        process.exit(1);
      }
      const repoRoot = repoRootResult.value;

      // Determine targets
      const targets = CLEAN_TARGETS.filter((t) => t.includeByDefault || options.all);

      if (options.dryRun) {
        console.log('(Dry run - no files will be modified)\n');
      }

      let cleanedCount = 0;
      let skippedCount = 0;

      for (const target of targets) {
        const targetDir = path.join(repoRoot, target.path, target.destSubdir);

        if (!fs.existsSync(targetDir)) {
          console.log(`  Skipped: ${target.name} (no data directory)`);
          skippedCount++;
          continue;
        }

        if (options.dryRun) {
          console.log(`  Would clean: ${target.name} -> ${target.path}/${target.destSubdir}`);
          cleanedCount++;
        } else {
          fs.rmSync(targetDir, { recursive: true });
          console.log(`  Cleaned: ${target.name} -> ${target.path}/${target.destSubdir}`);
          cleanedCount++;
        }
      }

      if (!options.all) {
        console.log('\nNote: ts-chocolate library was not cleaned (use --all to include)');
      }

      console.log(`\nCompleted: ${cleanedCount} cleaned, ${skippedCount} skipped`);
    });

  return cmd;
}
