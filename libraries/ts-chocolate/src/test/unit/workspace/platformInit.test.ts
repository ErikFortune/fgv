// Copyright (c) 2026 Erik Fortune
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

import '@fgv/ts-utils-jest';

import { FileTree } from '@fgv/ts-json-base';
import { CryptoUtils } from '@fgv/ts-extras';

import {
  toLibraryFileSources,
  toUserLibrarySource,
  createWorkspaceFromPlatform,
  ensureDirectoryPath,
  ensureWorkspaceDirectoriesInTree,
  IResolvedExternalLibrary,
  IPlatformInitResult
} from '../../../packlets/workspace';
import {
  DeviceId,
  ExternalLibraryRef,
  IBootstrapSettings,
  IPreferencesSettings,
  SETTINGS_SCHEMA_VERSION,
  resolvePreferencesSettings
} from '../../../packlets/settings';

describe('workspace platformInit helpers', () => {
  // ============================================================================
  // Helper: create an in-memory FileTree directory
  // ============================================================================

  function createInMemoryTree(
    inMemoryFiles?: FileTree.IInMemoryFile[],
    options?: { mutable?: boolean }
  ): FileTree.IFileTreeDirectoryItem {
    const files = inMemoryFiles ?? [{ path: '/placeholder.txt', contents: '' }];
    const tree = FileTree.inMemory(files, { mutable: options?.mutable ?? false }).orThrow();
    return tree.getItem('/').orThrow() as FileTree.IFileTreeDirectoryItem;
  }

  function createMutableTree(inMemoryFiles?: FileTree.IInMemoryFile[]): FileTree.IFileTreeDirectoryItem {
    return createInMemoryTree(inMemoryFiles, { mutable: true });
  }

  // ============================================================================
  // toLibraryFileSources
  // ============================================================================

  describe('toLibraryFileSources', () => {
    test('returns empty array for empty input', () => {
      const result = toLibraryFileSources([]);
      expect(result).toHaveLength(0);
    });

    test('converts a single library with load: true', () => {
      const tree = createInMemoryTree();
      const lib: IResolvedExternalLibrary = {
        name: 'Test Lib',
        originalRef: '/path/to/lib' as unknown as ExternalLibraryRef,
        fileTree: tree,
        load: true
      };
      const result = toLibraryFileSources([lib]);
      expect(result).toHaveLength(1);
      expect(result[0].directory).toBe(tree);
      expect(result[0].load).toBe(true);
    });

    test('converts a library with load: false', () => {
      const tree = createInMemoryTree();
      const lib: IResolvedExternalLibrary = {
        name: 'Disabled Lib',
        originalRef: '/path/disabled' as unknown as ExternalLibraryRef,
        fileTree: tree,
        load: false
      };
      const result = toLibraryFileSources([lib]);
      expect(result).toHaveLength(1);
      expect(result[0].load).toBe(false);
    });

    test('converts a library with per-sublibrary load spec', () => {
      const tree = createInMemoryTree();
      const lib: IResolvedExternalLibrary = {
        name: 'Partial Lib',
        originalRef: '/path/partial' as unknown as ExternalLibraryRef,
        fileTree: tree,
        load: { ingredients: true, fillings: false, default: true }
      };
      const result = toLibraryFileSources([lib]);
      expect(result).toHaveLength(1);
      const load = result[0].load as Record<string, boolean>;
      expect(load.ingredients).toBe(true);
      expect(load.fillings).toBe(false);
      expect(load.default).toBe(true);
    });

    test('preserves mutable flag', () => {
      const tree = createInMemoryTree();
      const lib: IResolvedExternalLibrary = {
        name: 'Mutable Lib',
        originalRef: '/path/mutable' as unknown as ExternalLibraryRef,
        fileTree: tree,
        load: true,
        mutable: true
      };
      const result = toLibraryFileSources([lib]);
      expect(result[0].mutable).toBe(true);
    });

    test('load is undefined when not specified', () => {
      const tree = createInMemoryTree();
      const lib: IResolvedExternalLibrary = {
        name: 'No Load Spec',
        originalRef: '/path/default' as unknown as ExternalLibraryRef,
        fileTree: tree
      };
      const result = toLibraryFileSources([lib]);
      expect(result[0].load).toBeUndefined();
    });

    test('converts multiple libraries', () => {
      const tree1 = createInMemoryTree();
      const tree2 = createInMemoryTree();
      const libs: IResolvedExternalLibrary[] = [
        {
          name: 'Lib One',
          originalRef: '/path/one' as unknown as ExternalLibraryRef,
          fileTree: tree1,
          load: true
        },
        {
          name: 'Lib Two',
          originalRef: '/path/two' as unknown as ExternalLibraryRef,
          fileTree: tree2,
          load: false,
          mutable: false
        }
      ];
      const result = toLibraryFileSources(libs);
      expect(result).toHaveLength(2);
      expect(result[0].directory).toBe(tree1);
      expect(result[1].directory).toBe(tree2);
    });
  });

  // ============================================================================
  // toUserLibrarySource
  // ============================================================================

  describe('toUserLibrarySource', () => {
    test('returns source with journals: true, sessions: true, default: false', () => {
      const tree = createInMemoryTree();
      const result = toUserLibrarySource(tree);
      const load = result.load as Record<string, boolean>;
      expect(load.journals).toBe(true);
      expect(load.sessions).toBe(true);
      expect(load.default).toBe(false);
    });

    test('defaults mutable to true', () => {
      const tree = createInMemoryTree();
      const result = toUserLibrarySource(tree);
      expect(result.mutable).toBe(true);
    });

    test('respects mutable: false override', () => {
      const tree = createInMemoryTree();
      const result = toUserLibrarySource(tree, 'unknown', false);
      expect(result.mutable).toBe(false);
    });

    test('directory is the provided tree', () => {
      const tree = createInMemoryTree();
      const result = toUserLibrarySource(tree);
      expect(result.directory).toBe(tree);
    });
  });

  // ============================================================================
  // createWorkspaceFromPlatform
  // ============================================================================

  describe('createWorkspaceFromPlatform', () => {
    const testDeviceId = 'test-device' as unknown as DeviceId;

    function createPlatformInitResult(overrides?: Partial<IPlatformInitResult>): IPlatformInitResult {
      const bootstrapSettings: IBootstrapSettings = {
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        includeBuiltIn: true,
        localStorage: { library: true, userData: true },
        externalLibraries: []
      };
      const preferencesSettings: IPreferencesSettings = {
        schemaVersion: SETTINGS_SCHEMA_VERSION
      };
      const resolved = resolvePreferencesSettings(preferencesSettings, testDeviceId);

      // The user library tree needs settings files for SettingsManager.createFromBootstrapWithMigration
      const files: FileTree.IInMemoryFile[] = [
        { path: '/library/data/settings/bootstrap.json', contents: bootstrapSettings },
        { path: '/library/data/settings/preferences.json', contents: preferencesSettings }
      ];
      const tree = FileTree.inMemory(files).orThrow();
      const userLibraryTree = tree.getItem('/library').orThrow() as FileTree.IFileTreeDirectoryItem;

      return {
        cryptoProvider: CryptoUtils.nodeCryptoProvider,
        userLibraryTree,
        externalLibraries: [],
        bootstrapSettings,
        resolvedSettings: resolved,
        deviceId: testDeviceId,
        ...overrides
      };
    }

    test('creates workspace successfully', () => {
      const platformInit = createPlatformInitResult();
      expect(createWorkspaceFromPlatform({ platformInit, builtin: false })).toSucceed();
    });

    test('workspace has settings manager attached', () => {
      const platformInit = createPlatformInitResult();
      expect(createWorkspaceFromPlatform({ platformInit, builtin: false })).toSucceedAndSatisfy((ws) => {
        expect(ws.settings).toBeDefined();
      });
    });

    test('workspace has no key store without key store file', () => {
      const platformInit = createPlatformInitResult();
      expect(createWorkspaceFromPlatform({ platformInit, builtin: false })).toSucceedAndSatisfy((ws) => {
        // No keyStoreFile in platformInit means no key store on workspace
        expect(ws.keyStore).toBeUndefined();
      });
    });

    test('workspace state is no-keystore without key store file', () => {
      const platformInit = createPlatformInitResult();
      expect(createWorkspaceFromPlatform({ platformInit, builtin: false })).toSucceedAndSatisfy((ws) => {
        expect(ws.state).toBe('no-keystore');
        expect(ws.isReady).toBe(true);
      });
    });

    test('external libraries are combined as file sources', () => {
      const extTree = createInMemoryTree();
      const platformInit = createPlatformInitResult({
        externalLibraries: [
          {
            name: 'Ext Lib',
            originalRef: '/ext/path' as unknown as ExternalLibraryRef,
            fileTree: extTree,
            load: false // disabled to avoid needing data subdirectories
          }
        ]
      });
      // Should succeed - external library source is incorporated (but not loaded)
      expect(createWorkspaceFromPlatform({ platformInit, builtin: false })).toSucceed();
    });
  });

  // ============================================================================
  // ensureDirectoryPath
  // ============================================================================

  describe('ensureDirectoryPath', () => {
    test('creates a single-level directory', () => {
      const root = createMutableTree();
      expect(ensureDirectoryPath(root, 'foo')).toSucceedAndSatisfy((dir) => {
        expect(dir.name).toBe('foo');
      });
    });

    test('creates nested directories', () => {
      const root = createMutableTree();
      expect(ensureDirectoryPath(root, 'data/ingredients')).toSucceedAndSatisfy((dir) => {
        expect(dir.name).toBe('ingredients');
      });
    });

    test('reuses existing directories', () => {
      const root = createMutableTree();
      // Create once
      const first = ensureDirectoryPath(root, 'data/ingredients').orThrow();
      // Create again — should return the same directory
      expect(ensureDirectoryPath(root, 'data/ingredients')).toSucceedAndSatisfy((dir) => {
        expect(dir.absolutePath).toBe(first.absolutePath);
      });
    });

    test('handles empty path segments (leading/trailing slashes)', () => {
      const root = createMutableTree();
      expect(ensureDirectoryPath(root, '/data//ingredients/')).toSucceedAndSatisfy((dir) => {
        expect(dir.name).toBe('ingredients');
      });
    });

    test('returns root for empty path', () => {
      const root = createMutableTree();
      expect(ensureDirectoryPath(root, '')).toSucceedAndSatisfy((dir) => {
        expect(dir.absolutePath).toBe(root.absolutePath);
      });
    });

    test('fails when directory creation is not supported', () => {
      // Immutable tree rejects directory creation
      const root = createInMemoryTree();
      expect(ensureDirectoryPath(root, 'newdir')).toFail();
    });
  });

  // ============================================================================
  // ensureWorkspaceDirectoriesInTree
  // ============================================================================

  describe('ensureWorkspaceDirectoriesInTree', () => {
    test('creates all standard workspace directories', () => {
      const root = createMutableTree();
      expect(ensureWorkspaceDirectoriesInTree(root)).toSucceed();

      // Verify a few key directories exist
      const children = root.getChildren().orThrow();
      const dataDir = children.find(
        (c): c is FileTree.IFileTreeDirectoryItem => 'getChildren' in c && c.name === 'data'
      );
      expect(dataDir).toBeDefined();

      const dataChildren = dataDir!.getChildren().orThrow();
      const names = dataChildren.map((c) => c.name);
      expect(names).toContain('ingredients');
      expect(names).toContain('fillings');
      expect(names).toContain('sessions');
      expect(names).toContain('journals');
      expect(names).toContain('settings');
    });

    test('is idempotent', () => {
      const root = createMutableTree();
      expect(ensureWorkspaceDirectoriesInTree(root)).toSucceed();
      expect(ensureWorkspaceDirectoriesInTree(root)).toSucceed();
    });

    test('fails when directory creation is not supported', () => {
      // Immutable tree does not support createChildDirectory
      const root = createInMemoryTree();
      expect(ensureWorkspaceDirectoriesInTree(root)).toFailWith(/Failed to ensure workspace directory/);
    });
  });

  // ============================================================================
  // createWorkspaceFromPlatform - additionalFileSources and keyStoreConfig
  // ============================================================================

  describe('createWorkspaceFromPlatform with keystore', () => {
    const testDeviceId = 'test-device' as unknown as DeviceId;

    function createPlatformInitResult(overrides?: Partial<IPlatformInitResult>): IPlatformInitResult {
      const bootstrapSettings: IBootstrapSettings = {
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        includeBuiltIn: true,
        localStorage: { library: true, userData: true },
        externalLibraries: []
      };
      const preferencesSettings: IPreferencesSettings = {
        schemaVersion: SETTINGS_SCHEMA_VERSION
      };
      const resolved = resolvePreferencesSettings(preferencesSettings, testDeviceId);

      // The user library tree needs settings files for SettingsManager.createFromBootstrapWithMigration
      const files: FileTree.IInMemoryFile[] = [
        { path: '/library/data/settings/bootstrap.json', contents: bootstrapSettings },
        { path: '/library/data/settings/preferences.json', contents: preferencesSettings }
      ];
      const tree = FileTree.inMemory(files).orThrow();
      const userLibraryTree = tree.getItem('/library').orThrow() as FileTree.IFileTreeDirectoryItem;

      return {
        cryptoProvider: CryptoUtils.nodeCryptoProvider,
        userLibraryTree,
        externalLibraries: [],
        bootstrapSettings,
        resolvedSettings: resolved,
        deviceId: testDeviceId,
        ...overrides
      };
    }

    test('creates workspace with keystore file', async () => {
      const keyStore = CryptoUtils.KeyStore.KeyStore.create({
        cryptoProvider: CryptoUtils.nodeCryptoProvider
      }).orThrow();
      await keyStore.initialize('test-password');
      const keystoreFile = (await keyStore.save('test-password')).orThrow();

      const platformInit = createPlatformInitResult({ keyStoreFile: keystoreFile });
      expect(createWorkspaceFromPlatform({ platformInit, builtin: false })).toSucceedAndSatisfy((ws) => {
        expect(ws.keyStore).toBeDefined();
        expect(ws.state).toBe('locked');
      });
    });

    test('creates workspace with additional file sources', () => {
      const platformInit = createPlatformInitResult();
      const extTree = createInMemoryTree();
      const additionalFileSources = [
        {
          sourceName: 'test',
          directory: extTree,
          load: false
        }
      ];

      expect(
        createWorkspaceFromPlatform({ platformInit, builtin: false, additionalFileSources })
      ).toSucceed();
    });
  });
});
