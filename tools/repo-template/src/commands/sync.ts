/**
 * Sync command — updates shared files in a consumer repo from the template source.
 * Templated files are NOT touched — they are owned by the consumer after creation.
 */

import * as fs from 'fs';
import * as path from 'path';
import { loadManifest, getDefaultManifestPath } from '../packlets/manifest';
import { copyFile, copyPackage, filesAreEqual, getGitCommit } from '../packlets/fs';

export interface ISyncOptions {
  targetDir: string;
  sourceDir: string;
  dryRun: boolean;
}

export async function runSync(options: ISyncOptions): Promise<void> {
  const { targetDir, sourceDir, dryRun } = options;

  if (!fs.existsSync(targetDir)) {
    throw new Error(`Target directory does not exist: ${targetDir}`);
  }
  if (!fs.existsSync(path.join(sourceDir, 'rush.json'))) {
    throw new Error(`Source directory is not a Rush repo: ${sourceDir}`);
  }

  const manifestPath = getDefaultManifestPath();
  const manifest = loadManifest(manifestPath);

  console.log('Syncing shared files');
  console.log(`  Source: ${sourceDir}`);
  console.log(`  Target: ${targetDir}`);
  if (dryRun) {
    console.log('  Mode:   DRY RUN (no changes will be made)');
  }
  console.log('');

  let copied = 0;
  let skipped = 0;
  let warnings = 0;

  // ── Sync individual shared files ──
  console.log('==> Syncing shared files...');

  for (const file of manifest.shared.files) {
    const srcPath = path.join(sourceDir, file.source);
    const dstPath = path.join(targetDir, file.destination);

    if (!fs.existsSync(srcPath)) {
      console.log(`  WARNING: Source not found: ${file.source}`);
      warnings++;
      continue;
    }

    if (dryRun) {
      if (fs.existsSync(dstPath) && filesAreEqual(srcPath, dstPath)) {
        console.log(`  [unchanged] ${file.destination}`);
        skipped++;
      } else if (fs.existsSync(dstPath)) {
        console.log(`  [would update] ${file.destination}`);
        copied++;
      } else {
        console.log(`  [would create] ${file.destination}`);
        copied++;
      }
    } else {
      if (fs.existsSync(dstPath) && filesAreEqual(srcPath, dstPath)) {
        skipped++;
      } else {
        copyFile(srcPath, dstPath);
        console.log(`  Updated: ${file.destination}`);
        copied++;
      }
    }
  }

  // ── Sync shared packages ──
  console.log('');
  console.log('==> Syncing shared packages...');

  for (const pkg of manifest.sharedPackages.packages) {
    const srcPath = path.join(sourceDir, pkg.source);
    const dstPath = path.join(targetDir, pkg.destination);

    if (!fs.existsSync(srcPath)) {
      console.log(`  WARNING: Source directory not found: ${pkg.source}`);
      warnings++;
      continue;
    }

    if (dryRun) {
      console.log(`  [would sync] ${pkg.destination}/`);
      copied++;
    } else {
      copyPackage(srcPath, dstPath);
      console.log(`  Synced package: ${pkg.destination}`);
      copied++;
    }
  }

  // ── Update sync metadata ──
  if (!dryRun) {
    const syncFilePath = path.join(targetDir, '.template-sync');
    if (fs.existsSync(syncFilePath)) {
      try {
        const syncData = JSON.parse(fs.readFileSync(syncFilePath, 'utf-8'));
        syncData.lastSyncedAt = new Date().toISOString();
        syncData.sourceCommit = getGitCommit(sourceDir);
        fs.writeFileSync(syncFilePath, JSON.stringify(syncData, null, 2) + '\n');
        console.log('');
        console.log('  Updated .template-sync');
      } catch {
        console.log('  WARNING: Could not update .template-sync');
      }
    }
  }

  // ── Summary ──
  console.log('');
  console.log('=== Sync complete ===');
  console.log(`  Updated:   ${copied}`);
  console.log(`  Unchanged: ${skipped}`);
  console.log(`  Warnings:  ${warnings}`);

  if (dryRun) {
    console.log('');
    console.log('This was a dry run. No files were modified.');
    console.log('Run without --dry-run to apply changes.');
  }

  if (!dryRun && copied > 0) {
    console.log('');
    console.log('Next steps:');
    console.log(`  1. Review changes: cd ${targetDir} && git diff`);
    console.log("  2. Commit: git add -A && git commit -m 'Sync shared files from template'");
  }
}
