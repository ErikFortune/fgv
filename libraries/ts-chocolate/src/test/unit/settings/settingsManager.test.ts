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

import {
  SettingsManager,
  DeviceId,
  IBootstrapSettings,
  IPreferencesSettings,
  SETTINGS_SCHEMA_VERSION,
  SETTINGS_DIR_PATH,
  BOOTSTRAP_SETTINGS_FILENAME,
  PREFERENCES_SETTINGS_FILENAME,
  type StorageRootId
} from '../../../packlets/settings';
import { CollectionId } from '../../../packlets/common';

describe('SettingsManager', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  const testDeviceId = 'test-device' as unknown as DeviceId;

  // ============================================================================
  // Constants
  // ============================================================================

  describe('constants', () => {
    test('SETTINGS_DIR_PATH is data/settings', () => {
      expect(SETTINGS_DIR_PATH).toBe('data/settings');
    });

    test('BOOTSTRAP_SETTINGS_FILENAME is bootstrap.json', () => {
      expect(BOOTSTRAP_SETTINGS_FILENAME).toBe('bootstrap.json');
    });

    test('PREFERENCES_SETTINGS_FILENAME is preferences.json', () => {
      expect(PREFERENCES_SETTINGS_FILENAME).toBe('preferences.json');
    });
  });

  // ============================================================================
  // Bootstrap / Preferences (new two-phase model)
  // ============================================================================

  const validBootstrapSettings: IBootstrapSettings = {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    includeBuiltIn: true,
    localStorage: { library: true, userData: true },
    externalLibraries: [{ name: 'Shared', ref: '/shared' as never }]
  };

  const validPreferencesSettings: IPreferencesSettings = {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    defaultTargets: { fillings: 'user' as CollectionId },
    tools: { scaling: { weightUnit: 'g', batchMultiplier: 1.5 } }
  };

  // Helper: creates a FileTree with bootstrap + preferences files
  function createBootstrapFileTree(
    bootstrap?: IBootstrapSettings,
    preferences?: IPreferencesSettings,
    options?: { mutable?: boolean }
  ): FileTree.IFileTreeDirectoryItem {
    const files: FileTree.IInMemoryFile[] = [];
    if (bootstrap !== undefined) {
      files.push({
        path: `/library/${SETTINGS_DIR_PATH}/${BOOTSTRAP_SETTINGS_FILENAME}`,
        contents: bootstrap
      });
    }
    if (preferences !== undefined) {
      files.push({
        path: `/library/${SETTINGS_DIR_PATH}/${PREFERENCES_SETTINGS_FILENAME}`,
        contents: preferences
      });
    }
    if (files.length === 0) {
      files.push({ path: '/library/readme.txt', contents: 'placeholder' });
    }
    const tree = FileTree.inMemory(files, { mutable: options?.mutable ?? false }).orThrow();
    return tree.getItem('/library').orThrow() as FileTree.IFileTreeDirectoryItem;
  }

  // ============================================================================
  // createFromBootstrap
  // ============================================================================

  describe('createFromBootstrap', () => {
    test('loads existing bootstrap and preferences files', () => {
      const fileTree = createBootstrapFileTree(validBootstrapSettings, validPreferencesSettings);
      expect(SettingsManager.createFromBootstrap({ fileTree, deviceId: testDeviceId })).toSucceedAndSatisfy(
        (manager) => {
          expect(manager.deviceId).toBe(testDeviceId);
          expect(manager.isDirty).toBe(false);
          const bootstrap = manager.getBootstrapSettings();
          const preferences = manager.getPreferencesSettings();
          expect(bootstrap.includeBuiltIn).toBe(true);
          expect(preferences.defaultTargets?.fillings).toBe('user');
        }
      );
    });

    test('creates default files when none exist', () => {
      const fileTree = createBootstrapFileTree();
      expect(SettingsManager.createFromBootstrap({ fileTree, deviceId: testDeviceId })).toSucceedAndSatisfy(
        (manager) => {
          expect(manager.isDirty).toBe(true);
          const bootstrap = manager.getBootstrapSettings();
          const preferences = manager.getPreferencesSettings();
          expect(bootstrap.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
          expect(preferences.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
        }
      );
    });

    test('getResolvedSettings uses preferences path', () => {
      const fileTree = createBootstrapFileTree(validBootstrapSettings, validPreferencesSettings);
      const manager = SettingsManager.createFromBootstrap({ fileTree, deviceId: testDeviceId }).orThrow();
      const resolved = manager.getResolvedSettings();
      expect(resolved.deviceId).toBe(testDeviceId);
      expect(resolved.defaultTargets.fillings).toBe('user');
    });

    test('fails for malformed bootstrap settings', () => {
      const files: FileTree.IInMemoryFile[] = [
        {
          path: `/library/${SETTINGS_DIR_PATH}/${BOOTSTRAP_SETTINGS_FILENAME}`,
          contents: { schemaVersion: 999 }
        }
      ];
      const tree = FileTree.inMemory(files).orThrow();
      const fileTree = tree.getItem('/library').orThrow() as FileTree.IFileTreeDirectoryItem;
      expect(SettingsManager.createFromBootstrap({ fileTree, deviceId: testDeviceId })).toFail();
    });

    test('fails for malformed preferences settings', () => {
      const files: FileTree.IInMemoryFile[] = [
        {
          path: `/library/${SETTINGS_DIR_PATH}/${BOOTSTRAP_SETTINGS_FILENAME}`,
          contents: validBootstrapSettings
        },
        {
          path: `/library/${SETTINGS_DIR_PATH}/${PREFERENCES_SETTINGS_FILENAME}`,
          contents: { schemaVersion: 999 }
        }
      ];
      const tree = FileTree.inMemory(files).orThrow();
      const fileTree = tree.getItem('/library').orThrow() as FileTree.IFileTreeDirectoryItem;
      expect(SettingsManager.createFromBootstrap({ fileTree, deviceId: testDeviceId })).toFail();
    });
  });

  // ============================================================================
  // Bootstrap/Preferences update methods
  // ============================================================================

  describe('updateBootstrapSettings', () => {
    test('merges updates and marks dirty', () => {
      const fileTree = createBootstrapFileTree(validBootstrapSettings, validPreferencesSettings);
      const manager = SettingsManager.createFromBootstrap({ fileTree, deviceId: testDeviceId }).orThrow();
      expect(manager.isDirty).toBe(false);

      expect(manager.updateBootstrapSettings({ includeBuiltIn: false })).toSucceedAndSatisfy((updated) => {
        expect(updated.includeBuiltIn).toBe(false);
        expect(updated.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
      });

      expect(manager.isDirty).toBe(true);
    });
  });

  describe('updatePreferencesSettings', () => {
    test('merges updates and marks dirty', () => {
      const fileTree = createBootstrapFileTree(validBootstrapSettings, validPreferencesSettings);
      const manager = SettingsManager.createFromBootstrap({ fileTree, deviceId: testDeviceId }).orThrow();
      expect(manager.isDirty).toBe(false);

      expect(
        manager.updatePreferencesSettings({
          defaultTargets: { molds: 'shared' as CollectionId }
        })
      ).toSucceedAndSatisfy((updated) => {
        expect(updated.defaultTargets?.molds).toBe('shared');
        expect(updated.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
      });

      expect(manager.isDirty).toBe(true);
    });
  });

  // ============================================================================
  // Convenience methods route to preferences when available
  // ============================================================================

  describe('convenience methods with preferences', () => {
    test('updateDefaultTargets routes to preferences', () => {
      const fileTree = createBootstrapFileTree(validBootstrapSettings, validPreferencesSettings);
      const manager = SettingsManager.createFromBootstrap({ fileTree, deviceId: testDeviceId }).orThrow();

      expect(manager.updateDefaultTargets({ molds: 'shared' as CollectionId })).toSucceedAndSatisfy(
        (targets) => {
          expect(targets.molds).toBe('shared');
          expect(targets.fillings).toBe('user');
        }
      );

      // Verify preferences was updated
      expect(manager.getPreferencesSettings().defaultTargets?.molds).toBe('shared');
    });

    test('updateDefaultStorageTargets routes to preferences', () => {
      const fileTree = createBootstrapFileTree(validBootstrapSettings, validPreferencesSettings);
      const manager = SettingsManager.createFromBootstrap({ fileTree, deviceId: testDeviceId }).orThrow();

      expect(
        manager.updateDefaultStorageTargets({ libraryDefault: 'main' as StorageRootId })
      ).toSucceedAndSatisfy((targets) => {
        expect(targets.libraryDefault).toBe('main');
      });

      expect(manager.getPreferencesSettings().defaultStorageTargets?.libraryDefault).toBe('main');
    });

    test('updateToolSettings routes to preferences', () => {
      const fileTree = createBootstrapFileTree(validBootstrapSettings, validPreferencesSettings);
      const manager = SettingsManager.createFromBootstrap({ fileTree, deviceId: testDeviceId }).orThrow();

      expect(manager.updateToolSettings({ scaling: { weightUnit: 'kg' } })).toSucceedAndSatisfy((tools) => {
        expect(tools.scaling?.weightUnit).toBe('kg');
        expect(tools.scaling?.batchMultiplier).toBe(1.5);
      });

      expect(manager.getPreferencesSettings().tools?.scaling?.weightUnit).toBe('kg');
    });

    test('updateToolSettings handles preferences with no tools', () => {
      const minimalPrefs: IPreferencesSettings = { schemaVersion: SETTINGS_SCHEMA_VERSION };
      const fileTree = createBootstrapFileTree(validBootstrapSettings, minimalPrefs);
      const manager = SettingsManager.createFromBootstrap({ fileTree, deviceId: testDeviceId }).orThrow();

      expect(manager.updateToolSettings({ scaling: { weightUnit: 'kg' } })).toSucceedAndSatisfy((tools) => {
        expect(tools.scaling?.weightUnit).toBe('kg');
      });
    });

    test('updateToolSettings handles preferences with no scaling', () => {
      const prefsNoScaling: IPreferencesSettings = {
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        tools: { workflow: { confirmAbandon: true } }
      };
      const fileTree = createBootstrapFileTree(validBootstrapSettings, prefsNoScaling);
      const manager = SettingsManager.createFromBootstrap({ fileTree, deviceId: testDeviceId }).orThrow();

      expect(manager.updateToolSettings({ scaling: { weightUnit: 'kg' } })).toSucceedAndSatisfy((tools) => {
        expect(tools.scaling?.weightUnit).toBe('kg');
        expect(tools.workflow?.confirmAbandon).toBe(true);
      });
    });

    test('updateToolSettings handles preferences with no workflow', () => {
      const prefsNoWorkflow: IPreferencesSettings = {
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        tools: { scaling: { weightUnit: 'g' } }
      };
      const fileTree = createBootstrapFileTree(validBootstrapSettings, prefsNoWorkflow);
      const manager = SettingsManager.createFromBootstrap({ fileTree, deviceId: testDeviceId }).orThrow();

      expect(manager.updateToolSettings({ workflow: { confirmAbandon: false } })).toSucceedAndSatisfy(
        (tools) => {
          expect(tools.workflow?.confirmAbandon).toBe(false);
          expect(tools.scaling?.weightUnit).toBe('g');
        }
      );
    });
  });

  // ============================================================================
  // save with bootstrap/preferences
  // ============================================================================

  describe('save (bootstrap/preferences)', () => {
    test('saves bootstrap and preferences to file tree', async () => {
      const fileTree = createBootstrapFileTree(validBootstrapSettings, validPreferencesSettings, {
        mutable: true
      });
      const manager = SettingsManager.createFromBootstrap({ fileTree, deviceId: testDeviceId }).orThrow();

      manager.updateBootstrapSettings({ includeBuiltIn: false }).orThrow();
      manager.updatePreferencesSettings({ defaultTargets: { molds: 'shared' as CollectionId } }).orThrow();

      const result = await manager.save();
      expect(result).toSucceedWith(true);
      expect(manager.isDirty).toBe(false);

      // Verify persistence
      const manager2 = SettingsManager.createFromBootstrap({ fileTree, deviceId: testDeviceId }).orThrow();
      expect(manager2.getBootstrapSettings().includeBuiltIn).toBe(false);
      expect(manager2.getPreferencesSettings().defaultTargets?.molds).toBe('shared');
    });

    test('fails on bootstrap save with immutable tree', async () => {
      const fileTree = createBootstrapFileTree(validBootstrapSettings, validPreferencesSettings);
      const manager = SettingsManager.createFromBootstrap({ fileTree, deviceId: testDeviceId }).orThrow();

      manager.updateBootstrapSettings({ includeBuiltIn: false }).orThrow();

      const result = await manager.save();
      expect(result).toFailWith(/failed to save.*bootstrap\.json/i);
    });

    test('fails on preferences save with immutable tree', async () => {
      const fileTree = createBootstrapFileTree(validBootstrapSettings, validPreferencesSettings);
      const manager = SettingsManager.createFromBootstrap({ fileTree, deviceId: testDeviceId }).orThrow();

      manager.updatePreferencesSettings({ defaultTargets: { molds: 'shared' as CollectionId } }).orThrow();

      const result = await manager.save();
      expect(result).toFailWith(/failed to save.*preferences\.json/i);
    });

    test('returns false when not dirty', async () => {
      const fileTree = createBootstrapFileTree(validBootstrapSettings, validPreferencesSettings, {
        mutable: true
      });
      const manager = SettingsManager.createFromBootstrap({ fileTree, deviceId: testDeviceId }).orThrow();
      expect(manager.isDirty).toBe(false);

      const result = await manager.save();
      expect(result).toSucceedWith(false);
    });

    test('fails when settings directory does not exist in tree', async () => {
      // Create a file tree with NO settings directory - just a plain file at root
      const files: FileTree.IInMemoryFile[] = [{ path: '/library/readme.txt', contents: 'no settings dir' }];
      const tree = FileTree.inMemory(files, { mutable: true }).orThrow();
      const fileTree = tree.getItem('/library').orThrow() as FileTree.IFileTreeDirectoryItem;

      // createFromBootstrap creates defaults (dirty) when no settings files found
      const manager = SettingsManager.createFromBootstrap({ fileTree, deviceId: testDeviceId }).orThrow();
      expect(manager.isDirty).toBe(true);

      // Save should fail because the settings directory doesn't exist
      const result = await manager.save();
      expect(result).toFailWith(/settings directory does not exist/i);
    });

    test('creates new bootstrap and preferences files on mutable tree', async () => {
      const files: FileTree.IInMemoryFile[] = [
        { path: `/library/${SETTINGS_DIR_PATH}/placeholder.txt`, contents: 'ensures directory exists' }
      ];
      const tree = FileTree.inMemory(files, { mutable: true }).orThrow();
      const fileTree = tree.getItem('/library').orThrow() as FileTree.IFileTreeDirectoryItem;

      const manager = SettingsManager.createFromBootstrap({ fileTree, deviceId: testDeviceId }).orThrow();
      expect(manager.isDirty).toBe(true);

      const result = await manager.save();
      expect(result).toSucceedWith(true);

      // Verify files were created
      const manager2 = SettingsManager.createFromBootstrap({ fileTree, deviceId: testDeviceId }).orThrow();
      expect(manager2.isDirty).toBe(false);
      const bootstrap = manager2.getBootstrapSettings();
      expect(bootstrap.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
    });
  });
});
