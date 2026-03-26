/**
 * init-library command — scaffolds a new library package within an existing Rush monorepo.
 */

import * as fs from 'fs';
import * as path from 'path';
import { patchFile, IPatchOperation } from '../packlets/jsonc';

export type RigType = 'dual' | 'node' | 'browser';
export type CategoryType = 'libraries' | 'tools' | 'apps' | 'services';

export interface IInitLibraryOptions {
  /** Package name (e.g. "ts-my-lib" — will be prefixed with @fgv/) */
  name: string;
  /** Short description */
  description: string;
  /** Heft rig to use */
  rig: RigType;
  /** Category folder */
  category: CategoryType;
  /** Rush monorepo root */
  repoDir: string;
  /** Version policy name (from version-policies.json) */
  versionPolicy: string;
  /** Initial version */
  version: string;
  /** Dependency version for @fgv/* packages ("workspace:*" for fgv, "^5.1.0-0" for consumers) */
  fgvDepVersion: string;
}

interface IRigConfig {
  rigPackageName: string;
  rigProfile?: string;
  rigDevDeps: Record<string, string>;
  tsconfigExtends: string;
  tsconfigTypes: string[];
  tsconfigLib?: string[];
}

const RIG_CONFIGS: Record<RigType, IRigConfig> = {
  dual: {
    rigPackageName: '@fgv/heft-dual-rig',
    rigDevDeps: {
      '@fgv/heft-dual-rig': 'FGV_DEP',
      '@rushstack/heft': '1.2.7',
      '@rushstack/heft-node-rig': '2.11.27'
    },
    tsconfigExtends: './node_modules/@rushstack/heft-node-rig/profiles/default/tsconfig-base.json',
    tsconfigTypes: ['heft-jest', 'node'],
    tsconfigLib: ['es2018']
  },
  node: {
    rigPackageName: '@rushstack/heft-node-rig',
    rigDevDeps: {
      '@rushstack/heft': '1.2.7',
      '@rushstack/heft-node-rig': '2.11.27'
    },
    tsconfigExtends: './node_modules/@rushstack/heft-node-rig/profiles/default/tsconfig-base.json',
    tsconfigTypes: ['heft-jest', 'node']
  },
  browser: {
    rigPackageName: '@rushstack/heft-web-rig',
    rigProfile: 'library',
    rigDevDeps: {
      '@rushstack/heft': '1.2.7',
      '@rushstack/heft-web-rig': '1.4.3'
    },
    tsconfigExtends: './node_modules/@rushstack/heft-web-rig/profiles/library/tsconfig-base.json',
    tsconfigTypes: ['heft-jest', 'node'],
    tsconfigLib: ['es2018', 'DOM']
  }
};

export async function runInitLibrary(options: IInitLibraryOptions): Promise<void> {
  const { name, description, rig, category, repoDir, versionPolicy, version, fgvDepVersion } = options;

  const packageName = name.startsWith('@fgv/') ? name : `@fgv/${name}`;
  const shortName = packageName.replace('@fgv/', '');
  const projectFolder = `${category}/${shortName}`;
  const projectDir = path.join(repoDir, projectFolder);

  if (fs.existsSync(projectDir)) {
    throw new Error(`Project directory already exists: ${projectDir}`);
  }

  const rushJsonPath = path.join(repoDir, 'rush.json');
  if (!fs.existsSync(rushJsonPath)) {
    throw new Error(`Not a Rush repo (no rush.json): ${repoDir}`);
  }

  const rigConfig = RIG_CONFIGS[rig];

  console.log(`Initializing library: ${packageName}`);
  console.log(`  Directory: ${projectFolder}`);
  console.log(`  Rig:       ${rig} (${rigConfig.rigPackageName})`);
  console.log(`  Version:   ${versionPolicy}@${version}`);
  console.log('');

  // ── Create directory structure ──
  fs.mkdirSync(path.join(projectDir, 'src', 'test', 'unit'), { recursive: true });
  fs.mkdirSync(path.join(projectDir, 'config'), { recursive: true });

  // ── package.json ──
  console.log('==> Creating package.json...');

  const devDependencies: Record<string, string> = {};
  // Add rig dependencies — @fgv/* packages use fgvDepVersion, others use their pinned version
  for (const [dep, ver] of Object.entries(rigConfig.rigDevDeps)) {
    devDependencies[dep] = dep.startsWith('@fgv/') ? fgvDepVersion : ver;
  }
  // Standard dev dependencies
  devDependencies['@fgv/ts-utils-jest'] = fgvDepVersion;
  devDependencies['@types/heft-jest'] = '1.0.6';
  devDependencies['@types/jest'] = '^29.5.14';
  devDependencies['@types/node'] = '^20.14.9';
  devDependencies['typescript'] = '5.9.3';
  devDependencies['@rushstack/eslint-config'] = '4.6.4';
  devDependencies['eslint'] = '^9.39.2';

  const packageJson: Record<string, unknown> = {
    name: packageName,
    version,
    description,
    main: 'lib/index.js',
    types: 'lib/index.d.ts',
    scripts: {
      build: 'heft build --clean',
      clean: 'heft clean',
      test: 'heft test --clean',
      coverage: 'jest --coverage',
      lint: 'eslint src --ext .ts',
      fixlint: 'eslint src --ext .ts --fix'
    },
    author: '',
    license: 'MIT',
    dependencies: {
      '@fgv/ts-utils': fgvDepVersion,
      '@fgv/ts-json-base': fgvDepVersion
    },
    devDependencies,
    repository: {
      type: 'git',
      url: ''
    }
  };

  // Add dual-emit exports for dual rig
  if (rig === 'dual') {
    packageJson['module'] = 'dist/index.js';
    packageJson['exports'] = {
      '.': {
        types: './lib/index.d.ts',
        import: './dist/index.js',
        require: './lib/index.js',
        default: './lib/index.js'
      }
    };
  }

  fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify(packageJson, null, 2) + '\n');

  // ── tsconfig.json ──
  console.log('  Creating tsconfig.json...');

  const tsconfig: Record<string, unknown> = {
    extends: rigConfig.tsconfigExtends,
    compilerOptions: {
      types: rigConfig.tsconfigTypes,
      ...(rigConfig.tsconfigLib ? { lib: rigConfig.tsconfigLib } : {})
    }
  };

  fs.writeFileSync(path.join(projectDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2) + '\n');

  // ── config/rig.json ──
  console.log('  Creating config/rig.json...');

  const rigJson: Record<string, unknown> = {
    $schema: 'https://developer.microsoft.com/json-schemas/rig-package/rig.schema.json',
    rigPackageName: rigConfig.rigPackageName
  };
  if (rigConfig.rigProfile) {
    rigJson['rigProfile'] = rigConfig.rigProfile;
  }

  fs.writeFileSync(path.join(projectDir, 'config', 'rig.json'), JSON.stringify(rigJson, null, 2) + '\n');

  // ── config/jest.config.json ──
  console.log('  Creating config/jest.config.json...');

  const jestConfig = {
    extends: '@rushstack/heft-node-rig/profiles/default/config/jest.config.json',
    coverageThreshold: {
      global: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100
      }
    },
    collectCoverage: true,
    coverageReporters: ['text', 'lcov', 'html']
  };

  fs.writeFileSync(
    path.join(projectDir, 'config', 'jest.config.json'),
    JSON.stringify(jestConfig, null, 2) + '\n'
  );

  // ── src/index.ts ──
  console.log('  Creating src/index.ts...');

  fs.writeFileSync(
    path.join(projectDir, 'src', 'index.ts'),
    `/**\n * @packageDocumentation\n * ${description}\n */\n`
  );

  // ── Register in rush.json ──
  console.log('');
  console.log('==> Registering in rush.json...');

  const rushJsonOps: IPatchOperation[] = [
    {
      type: 'add-to-array',
      path: 'projects',
      value: JSON.stringify({
        packageName,
        projectFolder,
        shouldPublish: true,
        versionPolicyName: versionPolicy,
        tags: [category]
      })
    }
  ];

  patchFile(rushJsonPath, rushJsonOps);
  console.log(`  Added ${packageName} at ${projectFolder}`);

  // ── Done ──
  console.log('');
  console.log(`=== Library ${packageName} initialized at ${projectFolder} ===`);
  console.log('');
  console.log('Next steps:');
  console.log(`  1. cd ${projectDir}`);
  console.log('  2. rush update');
  console.log('  3. rushx build');
  console.log('  4. Start adding code to src/');
  console.log('');
}
