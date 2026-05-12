/**
 * Link/unlink/update-fgv-versions commands — automate cross-repo development
 * between fgv and consumer Rush monorepos.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { parse as parseJsonc } from 'jsonc-parser';
import { IPatchOperation, patchFile } from '../packlets/jsonc';

// ── Interfaces ──

export interface ILinkOptions {
  fgvDir: string;
  repoDir: string;
}

export interface IUnlinkOptions {
  repoDir: string;
  version?: string;
}

export interface IUpdateFgvVersionsOptions {
  repoDir: string;
  version?: string;
}

interface IRushProject {
  packageName: string;
  projectFolder: string;
}

interface IPackageJsonDependencies {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

type FgvDependencyGraph = Map<string, Set<string>>;

// ── Discovery helpers ──

/**
 * Read a rush.json and return its project entries.
 */
function readRushProjects(rushJsonPath: string): IRushProject[] {
  const content = fs.readFileSync(rushJsonPath, 'utf-8');
  const rush = parseJsonc(content) as { projects: IRushProject[] };
  return rush.projects;
}

/**
 * Read a package.json and return its dependency sections.
 */
function readPackageJson(pkgJsonPath: string): IPackageJsonDependencies {
  return JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8')) as IPackageJsonDependencies;
}

/**
 * Collect a package.json's dependency names for direct consumer discovery.
 */
function collectDirectFgvDependencies(pkgJson: IPackageJsonDependencies): Set<string> {
  const allDeps: Record<string, string> = {
    ...(pkgJson.dependencies ?? {}),
    ...(pkgJson.devDependencies ?? {}),
    ...(pkgJson.peerDependencies ?? {})
  };

  const deps = new Set<string>();
  for (const [name, spec] of Object.entries(allDeps)) {
    if (name.startsWith('@fgv/') && spec !== 'workspace:*') {
      deps.add(name);
    }
  }

  return deps;
}

/**
 * Scan a consumer Rush repo and collect all @fgv/* dependencies (excluding workspace:* entries).
 * Returns a map of packageName -> list of project folders that depend on it.
 */
function discoverFgvDeps(repoDir: string): Map<string, string[]> {
  const rushJsonPath = path.join(repoDir, 'rush.json');
  if (!fs.existsSync(rushJsonPath)) {
    throw new Error(`rush.json not found at ${rushJsonPath}`);
  }

  const projects = readRushProjects(rushJsonPath);
  const deps = new Map<string, string[]>();

  for (const project of projects) {
    const pkgJsonPath = path.join(repoDir, project.projectFolder, 'package.json');
    if (!fs.existsSync(pkgJsonPath)) {
      continue;
    }

    const pkgJson = readPackageJson(pkgJsonPath);
    for (const name of collectDirectFgvDependencies(pkgJson)) {
      const existing = deps.get(name) ?? [];
      existing.push(project.projectFolder);
      deps.set(name, existing);
    }
  }

  return deps;
}

/**
 * Build an internal @fgv package dependency graph from the fgv worktree.
 * Only dependencies that exist in the fgv Rush projects are retained.
 */
function buildFgvDependencyGraph(fgvDir: string, fgvPackageMap: Map<string, string>): FgvDependencyGraph {
  const rushJsonPath = path.join(fgvDir, 'rush.json');
  if (!fs.existsSync(rushJsonPath)) {
    throw new Error(`fgv rush.json not found at ${rushJsonPath}`);
  }

  const projects = readRushProjects(rushJsonPath);
  const graph = new Map<string, Set<string>>();

  for (const project of projects) {
    const pkgJsonPath = path.join(fgvDir, project.projectFolder, 'package.json');
    if (!fs.existsSync(pkgJsonPath)) {
      continue;
    }

    const pkgJson = readPackageJson(pkgJsonPath);
    const internalDeps = new Set<string>();
    const allDeps: Record<string, string> = {
      ...(pkgJson.dependencies ?? {}),
      ...(pkgJson.devDependencies ?? {}),
      ...(pkgJson.peerDependencies ?? {})
    };

    for (const [dependencyName] of Object.entries(allDeps)) {
      if (fgvPackageMap.has(dependencyName) && dependencyName !== project.packageName) {
        internalDeps.add(dependencyName);
      }
    }

    graph.set(project.packageName, internalDeps);
  }

  return graph;
}

/**
 * Expand a set of package names to include all transitive internal dependencies.
 */
function expandFgvDependencyClosure(
  seedPackageNames: Iterable<string>,
  graph: FgvDependencyGraph
): Set<string> {
  const resolved = new Set<string>();
  const pending = [...seedPackageNames];

  while (pending.length > 0) {
    const packageName = pending.pop();
    if (!packageName || resolved.has(packageName)) {
      continue;
    }

    resolved.add(packageName);
    const directDeps = graph.get(packageName);
    if (!directDeps) {
      continue;
    }

    for (const dependencyName of directDeps) {
      if (!resolved.has(dependencyName)) {
        pending.push(dependencyName);
      }
    }
  }

  return resolved;
}

/**
 * Read the fgv worktree's rush.json and build a map of packageName -> projectFolder.
 */
function buildFgvPackageMap(fgvDir: string): Map<string, string> {
  const rushJsonPath = path.join(fgvDir, 'rush.json');
  if (!fs.existsSync(rushJsonPath)) {
    throw new Error(`fgv rush.json not found at ${rushJsonPath}`);
  }

  const projects = readRushProjects(rushJsonPath);
  const map = new Map<string, string>();
  for (const project of projects) {
    map.set(project.packageName, project.projectFolder);
  }
  return map;
}

// ── Version helpers ──

/**
 * Query npm for the latest prerelease version of @fgv/ts-utils and construct a ~X.Y.Z spec.
 */
function resolveLatestFgvVersion(): string {
  const output = execSync('npm view @fgv/ts-utils dist-tags --json', { encoding: 'utf-8' });
  const tags = JSON.parse(output) as Record<string, string>;
  const version = tags.alpha ?? tags.latest;
  if (!version) {
    throw new Error('Could not determine latest @fgv version from npm dist-tags');
  }
  return `~${version}`;
}

/**
 * Update all @fgv/* dependency versions (excluding workspace:*) in a consumer repo's package.json files.
 * Uses jsonc-parser modify() to preserve formatting.
 */
function updateVersionsInPackageJsons(repoDir: string, versionSpec: string): string[] {
  const rushJsonPath = path.join(repoDir, 'rush.json');
  const projects = readRushProjects(rushJsonPath);
  const changed: string[] = [];

  for (const project of projects) {
    const pkgJsonPath = path.join(repoDir, project.projectFolder, 'package.json');
    if (!fs.existsSync(pkgJsonPath)) {
      continue;
    }

    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
    const operations: IPatchOperation[] = [];

    for (const depField of ['dependencies', 'devDependencies'] as const) {
      const deps: Record<string, string> | undefined = pkgJson[depField];
      if (!deps) continue;

      for (const [name, spec] of Object.entries(deps)) {
        if (name.startsWith('@fgv/') && spec !== 'workspace:*') {
          operations.push({
            type: 'set-json',
            path: `${depField}.${name}`,
            value: JSON.stringify(versionSpec)
          });
        }
      }
    }

    if (operations.length > 0) {
      patchFile(pkgJsonPath, operations);
      changed.push(pkgJsonPath);
    }
  }

  return changed;
}

// ── Command runners ──

export async function runLink(options: ILinkOptions): Promise<void> {
  const { fgvDir, repoDir } = options;

  console.log(`==> Linking to local fgv worktree`);
  console.log(`  fgv dir:  ${fgvDir}`);
  console.log(`  repo dir: ${repoDir}`);

  const fgvDeps = discoverFgvDeps(repoDir);
  if (fgvDeps.size === 0) {
    console.log('  No @fgv/* dependencies found in consumer repo.');
    return;
  }

  const fgvPackageMap = buildFgvPackageMap(fgvDir);
  const fgvDependencyGraph = buildFgvDependencyGraph(fgvDir, fgvPackageMap);
  const linkedPackageNames = expandFgvDependencyClosure(fgvDeps.keys(), fgvDependencyGraph);

  // Compute file: overrides relative to common/temp/
  const commonTempDir = path.join(repoDir, 'common', 'temp');
  const overrides: Record<string, string> = {};
  const warnings: string[] = [];

  for (const packageName of linkedPackageNames) {
    const projectFolder = fgvPackageMap.get(packageName);
    if (!projectFolder) {
      warnings.push(`  Warning: ${packageName} not found in fgv worktree — skipping`);
      continue;
    }
    const absoluteProjectPath = path.join(fgvDir, projectFolder);
    const relativePath = path.relative(commonTempDir, absoluteProjectPath);
    overrides[packageName] = `file:${relativePath}`;
  }

  for (const w of warnings) {
    console.warn(w);
  }

  // Patch pnpm-config.json
  const pnpmConfigPath = path.join(repoDir, 'common', 'config', 'rush', 'pnpm-config.json');
  if (!fs.existsSync(pnpmConfigPath)) {
    throw new Error(`pnpm-config.json not found at ${pnpmConfigPath}`);
  }

  const patchOps: IPatchOperation[] = [
    {
      type: 'set-json',
      path: 'globalOverrides',
      value: JSON.stringify(overrides)
    },
    {
      type: 'set',
      path: 'strictPeerDependencies',
      value: false
    },
    {
      type: 'set-json',
      path: 'globalPeerDependencyRules',
      value: JSON.stringify({ ignoreMissing: ['mustache'], allowAny: ['@fgv/*'] })
    }
  ];

  patchFile(pnpmConfigPath, patchOps);

  console.log(`\n  Patched: ${pnpmConfigPath}`);
  console.log(`  Overrides (${Object.keys(overrides).length} packages):`);
  for (const [name, filePath] of Object.entries(overrides)) {
    console.log(`    ${name} -> ${filePath}`);
  }
  console.log(`\n  Next: run "rush update --purge" in the consumer repo.`);
}

export async function runUnlink(options: IUnlinkOptions): Promise<void> {
  const { repoDir, version } = options;

  console.log(`==> Unlinking from local fgv worktree`);
  console.log(`  repo dir: ${repoDir}`);

  // Restore pnpm-config.json to defaults
  const pnpmConfigPath = path.join(repoDir, 'common', 'config', 'rush', 'pnpm-config.json');
  if (!fs.existsSync(pnpmConfigPath)) {
    throw new Error(`pnpm-config.json not found at ${pnpmConfigPath}`);
  }

  const patchOps: IPatchOperation[] = [
    {
      type: 'set-json',
      path: 'globalOverrides',
      value: JSON.stringify({})
    },
    {
      type: 'set',
      path: 'strictPeerDependencies',
      value: true
    },
    {
      type: 'set-json',
      path: 'globalPeerDependencyRules',
      value: JSON.stringify({})
    }
  ];

  patchFile(pnpmConfigPath, patchOps);
  console.log(`  Patched: ${pnpmConfigPath} (restored defaults)`);

  // Optionally bump versions
  if (version) {
    console.log(`\n  Bumping @fgv/* deps to ${version}...`);
    const changed = updateVersionsInPackageJsons(repoDir, version);
    console.log(`  Updated ${changed.length} package.json file(s):`);
    for (const f of changed) {
      console.log(`    ${f}`);
    }
  }

  console.log(`\n  Next: run "rush update --purge" in the consumer repo.`);
}

export async function runUpdateFgvVersions(options: IUpdateFgvVersionsOptions): Promise<void> {
  const { repoDir } = options;

  console.log(`==> Updating @fgv/* version specs`);
  console.log(`  repo dir: ${repoDir}`);

  // Resolve version
  let versionSpec: string;
  if (options.version) {
    versionSpec = options.version;
    console.log(`  Using explicit version: ${versionSpec}`);
  } else {
    console.log('  Querying npm for latest version...');
    versionSpec = resolveLatestFgvVersion();
    console.log(`  Resolved version: ${versionSpec}`);
  }

  const changed = updateVersionsInPackageJsons(repoDir, versionSpec);
  console.log(`\n  Updated ${changed.length} package.json file(s):`);
  for (const f of changed) {
    console.log(`    ${f}`);
  }

  if (changed.length > 0) {
    console.log(`\n  Next: run "rush update --purge" in the consumer repo.`);
  }
}
