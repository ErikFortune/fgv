/**
 * Create command — stamps out a new fgv-derived Rush monorepo.
 *
 * Uses `rush init` to generate base config with full documentation,
 * then applies fgv-specific customizations via JSONC patching and shared file sync.
 */

import * as fs from 'fs';
import * as path from 'path';
import { loadManifest, getDefaultManifestPath } from '../packlets/manifest';
import { patchFile, IPatchOperation } from '../packlets/jsonc';
import { renderTemplateFile, getDefaultTemplatesDir, ITemplateVars } from '../packlets/template';
import { copyFile, copyPackage, exec, getGitCommit, getGitRemoteUrl } from '../packlets/fs';

export interface ICreateOptions {
  targetDir: string;
  repoUrl: string;
  versionPolicy: string;
  version: string;
  sourceDir: string;
  allowExisting: boolean;
  gitInit: boolean;
}

const RUSH_VERSION = '5.172.1';

const NODE_VERSION_RANGE =
  '>=14.15.0 <15.0.0 || >=16.13.0 <17.0.0 || >=18.15.0 <19.0.0 || >=20.18.0 <21.0.0 || >=22.22.0 <23.0.0';

export async function runCreate(options: ICreateOptions): Promise<void> {
  const { targetDir, repoUrl, versionPolicy, version, sourceDir, allowExisting, gitInit } = options;

  // Validate
  if (!allowExisting && fs.existsSync(targetDir)) {
    throw new Error(`Target directory already exists: ${targetDir} (use --allow-existing to override)`);
  }
  if (!fs.existsSync(path.join(sourceDir, 'rush.json'))) {
    throw new Error(`Source directory is not a Rush repo: ${sourceDir}`);
  }

  const manifestPath = getDefaultManifestPath();
  const templatesDir = getDefaultTemplatesDir();
  const manifest = loadManifest(manifestPath);

  console.log(`Creating new monorepo at: ${targetDir}`);
  console.log(`  Source repo: ${sourceDir}`);
  console.log(`  Repo URL:    ${repoUrl}`);
  console.log(`  Version:     ${versionPolicy}@${version}`);
  console.log('');

  fs.mkdirSync(targetDir, { recursive: true });

  // ── Step 1: rush init ──
  if (fs.existsSync(path.join(targetDir, 'rush.json'))) {
    console.log('==> Target already has rush.json, skipping rush init');
  } else {
    console.log('==> Running rush init...');
    try {
      const output = exec(`npx "@microsoft/rush@${RUSH_VERSION}" init`, { cwd: targetDir });
      for (const line of output.split('\n')) {
        console.log(`  ${line}`);
      }
    } catch (err: unknown) {
      // rush init writes to stderr for some messages, check if rush.json was created
      if (!fs.existsSync(path.join(targetDir, 'rush.json'))) {
        throw new Error(`rush init failed: ${(err as Error).message}`);
      }
    }
  }

  // ── Step 2: Patch rush.json ──
  console.log('');
  console.log('==> Patching rush.json with fgv customizations...');

  const rushJsonOps: IPatchOperation[] = [
    { type: 'set', path: 'nodeSupportedVersionRange', value: NODE_VERSION_RANGE },
    { type: 'set', path: 'ensureConsistentVersions', value: true },
    { type: 'uncomment', path: 'projectFolderMinDepth' },
    { type: 'set', path: 'projectFolderMinDepth', value: 2 },
    { type: 'uncomment', path: 'projectFolderMaxDepth' },
    { type: 'set', path: 'projectFolderMaxDepth', value: 2 },
    { type: 'uncomment', path: 'url' },
    { type: 'set', path: 'repository.url', value: repoUrl },
    { type: 'uncomment', path: 'defaultBranch' },
    { type: 'uncomment', path: 'defaultRemote' }
  ];

  patchFile(path.join(targetDir, 'rush.json'), rushJsonOps);
  for (const op of rushJsonOps) {
    const desc =
      op.type === 'uncomment' || op.type === 'remove'
        ? `  ${op.type}: ${op.path}`
        : `  ${op.type}: ${op.path}`;
    console.log(desc);
  }

  // ── Step 3: Patch other rush config files ──
  console.log('');
  console.log('==> Patching rush config files...');

  patchFile(path.join(targetDir, 'common/config/rush/build-cache.json'), [
    { type: 'set', path: 'buildCacheEnabled', value: true }
  ]);
  console.log('  build-cache.json: buildCacheEnabled = true');

  patchFile(path.join(targetDir, 'common/config/rush/pnpm-config.json'), [
    { type: 'uncomment', path: 'strictPeerDependencies' },
    { type: 'set', path: 'strictPeerDependencies', value: true }
  ]);
  console.log('  pnpm-config.json: strictPeerDependencies = true');

  // ── Step 4: Generate templated files ──
  console.log('');
  console.log('==> Generating templated config files...');

  const templateVars: ITemplateVars = {
    REPO_URL: repoUrl,
    VERSION_POLICY_NAME: versionPolicy,
    VERSION: version
  };

  for (const tmpl of manifest.templated.files) {
    const templatePath = path.join(sourceDir, tmpl.template);
    const destPath = path.join(targetDir, tmpl.destination);
    renderTemplateFile(templatePath, destPath, templateVars);
  }

  // ── Step 5: Copy shared files ──
  console.log('');
  console.log('==> Copying shared files...');

  for (const file of manifest.shared.files) {
    const srcPath = path.join(sourceDir, file.source);
    const destPath = path.join(targetDir, file.destination);
    if (!fs.existsSync(srcPath)) {
      console.warn(`  WARNING: Source file not found, skipping: ${file.source}`);
      continue;
    }
    copyFile(srcPath, destPath);
    console.log(`  Copied: ${file.destination}`);
  }

  for (const pkg of manifest.sharedPackages.packages) {
    const srcPath = path.join(sourceDir, pkg.source);
    const destPath = path.join(targetDir, pkg.destination);
    if (!fs.existsSync(srcPath)) {
      console.warn(`  WARNING: Source directory not found, skipping: ${pkg.source}`);
      continue;
    }
    copyPackage(srcPath, destPath);
    console.log(`  Copied package: ${pkg.destination}`);
  }

  // ── Step 6: Create standard directories ──
  console.log('');
  console.log('==> Creating directory structure...');

  const dirs = ['libraries', 'tools', 'apps', 'services', '.claude/project', '.claude/skills'];
  for (const dir of dirs) {
    fs.mkdirSync(path.join(targetDir, dir), { recursive: true });
  }

  const gitkeeps = ['.claude/project/.gitkeep', '.claude/skills/.gitkeep'];
  for (const gk of gitkeeps) {
    fs.writeFileSync(path.join(targetDir, gk), '');
  }
  console.log('  Created standard directory structure');

  // ── Step 7: Record template metadata ──
  console.log('');
  console.log('==> Recording template metadata...');

  const sourceCommit = getGitCommit(sourceDir);
  const sourceRepo = getGitRemoteUrl(sourceDir);

  const syncMetadata = {
    templateSource: repoUrl,
    sourceRepo,
    sourceCommit,
    createdAt: new Date().toISOString(),
    lastSyncedAt: new Date().toISOString(),
    manifestVersion: '1.0.0'
  };
  fs.writeFileSync(path.join(targetDir, '.template-sync'), JSON.stringify(syncMetadata, null, 2) + '\n');
  console.log('  Created .template-sync');

  // ── Step 8: Git init ──
  if (gitInit) {
    console.log('');
    console.log('==> Initializing git repository...');
    try {
      exec('git init -b main', { cwd: targetDir });
      exec('git add -A', { cwd: targetDir });
      exec(
        `git commit -m "Initial commit from fgv monorepo template\n\nSource: ${sourceDir}\nTemplate commit: ${sourceCommit}"`,
        { cwd: targetDir }
      );
      console.log('  Git repository initialized with initial commit');
    } catch (err: unknown) {
      console.warn(`  WARNING: Git init failed: ${(err as Error).message}`);
    }
  }

  // ── Done ──
  console.log('');
  console.log(`=== Monorepo created successfully at: ${targetDir} ===`);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Add your domain packages to libraries/, apps/, tools/, services/');
  console.log('  2. Register them in rush.json');
  console.log('  3. Fill in the project table in CLAUDE.md');
  console.log('  4. Fill in ACTIVE_DEVELOPMENT.md with your domain projects');
  console.log('  5. Add domain-specific Rush commands to common/config/rush/command-line.json');
  console.log(`  6. Run: cd ${targetDir} && rush install && rush build`);
  console.log('');
}
