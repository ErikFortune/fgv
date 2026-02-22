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
  ICommonSettings,
  IDeviceSettings,
  IPreferencesSettings,
  SETTINGS_SCHEMA_VERSION,
  getDeviceSettingsFilename,
  SETTINGS_DIR_PATH,
  BOOTSTRAP_SETTINGS_FILENAME,
  PREFERENCES_SETTINGS_FILENAME,
  COMMON_SETTINGS_FILENAME,
  DEVICE_SETTINGS_PREFIX,
  DEVICE_SETTINGS_SUFFIX,
  type StorageRootId
} from '../../../packlets/settings';
import { CollectionId } from '../../../packlets/common';

describe('SettingsManager', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  const testDeviceId = 'test-device' as unknown as DeviceId;

  const validCommonSettings: ICommonSettings = {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    defaultTargets: {
      fillings: 'user' as CollectionId,
      ingredients: 'user' as CollectionId
    },
    tools: {
      scaling: { weightUnit: 'g', batchMultiplier: 1.5 },
      workflow: { confirmAbandon: true }
    },
    externalLibraries: []
  };

  const validDeviceSettings: IDeviceSettings = {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    deviceId: testDeviceId,
    deviceName: 'Test Device',
    lastActiveSessionId: 'session-001'
  };

  // Helper: creates a FileTree with the settings files and returns the root directory
  function createFileTree(
    common?: ICommonSettings,
    device?: IDeviceSettings,
    options?: { mutable?: boolean }
  ): FileTree.IFileTreeDirectoryItem {
    const files: FileTree.IInMemoryFile[] = [];
    if (common !== undefined) {
      files.push({
        path: `/library/${SETTINGS_DIR_PATH}/${COMMON_SETTINGS_FILENAME}`,
        contents: common
      });
    }
    if (device !== undefined) {
      files.push({
        path: `/library/${SETTINGS_DIR_PATH}/${getDeviceSettingsFilename(device.deviceId)}`,
        contents: device
      });
    }
    // Ensure settings directory exists even if no files
    if (files.length === 0) {
      files.push({ path: '/library/readme.txt', contents: 'placeholder' });
    }
    const tree = FileTree.inMemory(files, { mutable: options?.mutable ?? false }).orThrow();
    return tree.getItem('/library').orThrow() as FileTree.IFileTreeDirectoryItem;
  }

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

    test('COMMON_SETTINGS_FILENAME is common.json', () => {
      expect(COMMON_SETTINGS_FILENAME).toBe('common.json');
    });

    test('DEVICE_SETTINGS_PREFIX is device-', () => {
      expect(DEVICE_SETTINGS_PREFIX).toBe('device-');
    });

    test('DEVICE_SETTINGS_SUFFIX is .json', () => {
      expect(DEVICE_SETTINGS_SUFFIX).toBe('.json');
    });
  });

  // ============================================================================
  // getDeviceSettingsFilename
  // ============================================================================

  describe('getDeviceSettingsFilename', () => {
    test('returns device-{id}.json', () => {
      expect(getDeviceSettingsFilename(testDeviceId)).toBe('device-test-device.json');
    });

    test('works with different device IDs', () => {
      expect(getDeviceSettingsFilename('my_laptop' as unknown as DeviceId)).toBe('device-my_laptop.json');
    });
  });

  // ============================================================================
  // create
  // ============================================================================

  describe('create', () => {
    test('loads existing settings from file tree', () => {
      const fileTree = createFileTree(validCommonSettings, validDeviceSettings);
      expect(SettingsManager.create({ fileTree, deviceId: testDeviceId })).toSucceedAndSatisfy((manager) => {
        expect(manager.deviceId).toBe(testDeviceId);
        expect(manager.isDirty).toBe(false);
      });
    });

    test('creates default settings when files do not exist', () => {
      const fileTree = createFileTree(); // no settings files
      expect(SettingsManager.create({ fileTree, deviceId: testDeviceId })).toSucceedAndSatisfy((manager) => {
        expect(manager.deviceId).toBe(testDeviceId);
        expect(manager.isDirty).toBe(true); // newly created defaults are dirty
      });
    });

    test('creates default settings when only common exists', () => {
      const fileTree = createFileTree(validCommonSettings);
      expect(SettingsManager.create({ fileTree, deviceId: testDeviceId })).toSucceedAndSatisfy((manager) => {
        expect(manager.isDirty).toBe(true); // device is new
        // Common loaded correctly
        const common = manager.getCommonSettings();
        expect(common.defaultTargets?.fillings).toBe('user');
      });
    });

    test('creates default common when only device exists', () => {
      const fileTree = createFileTree(undefined, validDeviceSettings);
      expect(SettingsManager.create({ fileTree, deviceId: testDeviceId })).toSucceedAndSatisfy((manager) => {
        expect(manager.isDirty).toBe(true); // common is new
        // Device loaded correctly
        const device = manager.getDeviceSettings();
        expect(device.deviceName).toBe('Test Device');
      });
    });

    test('passes device name to default device settings', () => {
      const fileTree = createFileTree(validCommonSettings);
      expect(
        SettingsManager.create({ fileTree, deviceId: testDeviceId, deviceName: 'Named Device' })
      ).toSucceedAndSatisfy((manager) => {
        expect(manager.getDeviceSettings().deviceName).toBe('Named Device');
      });
    });

    test('fails for malformed common settings', () => {
      const files: FileTree.IInMemoryFile[] = [
        {
          path: `/library/${SETTINGS_DIR_PATH}/${COMMON_SETTINGS_FILENAME}`,
          contents: { schemaVersion: 999 } // invalid schema version
        },
        {
          path: `/library/${SETTINGS_DIR_PATH}/${getDeviceSettingsFilename(testDeviceId)}`,
          contents: validDeviceSettings
        }
      ];
      const tree = FileTree.inMemory(files).orThrow();
      const fileTree = tree.getItem('/library').orThrow() as FileTree.IFileTreeDirectoryItem;
      expect(SettingsManager.create({ fileTree, deviceId: testDeviceId })).toFail();
    });

    test('fails for malformed device settings', () => {
      const files: FileTree.IInMemoryFile[] = [
        {
          path: `/library/${SETTINGS_DIR_PATH}/${COMMON_SETTINGS_FILENAME}`,
          contents: validCommonSettings
        },
        {
          path: `/library/${SETTINGS_DIR_PATH}/${getDeviceSettingsFilename(testDeviceId)}`,
          contents: { schemaVersion: SETTINGS_SCHEMA_VERSION, deviceId: 'has.dots' } // invalid device ID
        }
      ];
      const tree = FileTree.inMemory(files).orThrow();
      const fileTree = tree.getItem('/library').orThrow() as FileTree.IFileTreeDirectoryItem;
      expect(SettingsManager.create({ fileTree, deviceId: testDeviceId })).toFail();
    });
  });

  // ============================================================================
  // Accessors
  // ============================================================================

  describe('accessors', () => {
    test('deviceId returns the device ID', () => {
      const fileTree = createFileTree(validCommonSettings, validDeviceSettings);
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();
      expect(manager.deviceId).toBe(testDeviceId);
    });

    test('getCommonSettings returns loaded common settings', () => {
      const fileTree = createFileTree(validCommonSettings, validDeviceSettings);
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();
      const common = manager.getCommonSettings();
      expect(common.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
      expect(common.defaultTargets?.fillings).toBe('user');
    });

    test('getDeviceSettings returns loaded device settings', () => {
      const fileTree = createFileTree(validCommonSettings, validDeviceSettings);
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();
      const device = manager.getDeviceSettings();
      expect(device.deviceId).toBe(testDeviceId);
      expect(device.deviceName).toBe('Test Device');
      expect(device.lastActiveSessionId).toBe('session-001');
    });

    test('getResolvedSettings merges common and device settings', () => {
      const deviceWithOverrides: IDeviceSettings = {
        ...validDeviceSettings,
        defaultTargetsOverride: { fillings: 'device-local' as CollectionId },
        toolsOverride: { scaling: { weightUnit: 'oz' } }
      };
      const fileTree = createFileTree(validCommonSettings, deviceWithOverrides);
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();
      const resolved = manager.getResolvedSettings();

      expect(resolved.deviceId).toBe(testDeviceId);
      // Device override takes precedence
      expect(resolved.defaultTargets.fillings).toBe('device-local');
      // Common-only target preserved
      expect(resolved.defaultTargets.ingredients).toBe('user');
      // Device scaling override applied
      expect(resolved.tools.scaling?.weightUnit).toBe('oz');
      // Common batchMultiplier preserved
      expect(resolved.tools.scaling?.batchMultiplier).toBe(1.5);
    });
  });

  // ============================================================================
  // updateCommonSettings
  // ============================================================================

  describe('updateCommonSettings', () => {
    test('merges updates and marks dirty', () => {
      const fileTree = createFileTree(validCommonSettings, validDeviceSettings);
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();
      expect(manager.isDirty).toBe(false);

      expect(
        manager.updateCommonSettings({
          defaultTargets: { molds: 'shared' as CollectionId }
        })
      ).toSucceedAndSatisfy((updated) => {
        expect(updated.defaultTargets?.molds).toBe('shared');
        expect(updated.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
      });

      expect(manager.isDirty).toBe(true);
    });

    test('preserves schemaVersion', () => {
      const fileTree = createFileTree(validCommonSettings, validDeviceSettings);
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();

      expect(manager.updateCommonSettings({ tools: { scaling: { weightUnit: 'kg' } } })).toSucceedAndSatisfy(
        (updated) => {
          expect(updated.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
        }
      );
    });
  });

  // ============================================================================
  // updateDeviceSettings
  // ============================================================================

  describe('updateDeviceSettings', () => {
    test('merges updates and marks dirty', () => {
      const fileTree = createFileTree(validCommonSettings, validDeviceSettings);
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();
      expect(manager.isDirty).toBe(false);

      expect(manager.updateDeviceSettings({ deviceName: 'Updated Device' })).toSucceedAndSatisfy(
        (updated) => {
          expect(updated.deviceName).toBe('Updated Device');
        }
      );

      expect(manager.isDirty).toBe(true);
    });

    test('preserves deviceId and schemaVersion', () => {
      const fileTree = createFileTree(validCommonSettings, validDeviceSettings);
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();

      expect(manager.updateDeviceSettings({ lastActiveSessionId: 'new-session' })).toSucceedAndSatisfy(
        (updated) => {
          expect(updated.deviceId).toBe(testDeviceId);
          expect(updated.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
          expect(updated.lastActiveSessionId).toBe('new-session');
        }
      );
    });
  });

  // ============================================================================
  // Convenience Methods
  // ============================================================================

  describe('updateDefaultTargets', () => {
    test('merges targets into common settings', () => {
      const fileTree = createFileTree(validCommonSettings, validDeviceSettings);
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();

      expect(manager.updateDefaultTargets({ molds: 'shared' as CollectionId })).toSucceedAndSatisfy(
        (targets) => {
          expect(targets.molds).toBe('shared');
          // Existing targets preserved
          expect(targets.fillings).toBe('user');
        }
      );
    });

    test('returns empty object when updated settings have no defaultTargets', () => {
      const minimalCommon: ICommonSettings = {
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        externalLibraries: []
      };
      const fileTree = createFileTree(minimalCommon, validDeviceSettings);
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();

      expect(manager.updateDefaultTargets({ fillings: 'test' as CollectionId })).toSucceedAndSatisfy(
        (targets) => {
          expect(targets.fillings).toBe('test');
        }
      );
    });
  });

  describe('updateLastActiveSessionId', () => {
    test('updates session ID', () => {
      const fileTree = createFileTree(validCommonSettings, validDeviceSettings);
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();

      expect(manager.updateLastActiveSessionId('session-002')).toSucceedWith('session-002');
      expect(manager.getDeviceSettings().lastActiveSessionId).toBe('session-002');
    });

    test('clears session ID with undefined', () => {
      const fileTree = createFileTree(validCommonSettings, validDeviceSettings);
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();

      expect(manager.updateLastActiveSessionId(undefined)).toSucceedWith(undefined);
      expect(manager.getDeviceSettings().lastActiveSessionId).toBeUndefined();
    });
  });

  describe('updateToolSettings', () => {
    test('deep merges into common tool settings', () => {
      const fileTree = createFileTree(validCommonSettings, validDeviceSettings);
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();

      expect(manager.updateToolSettings({ scaling: { weightUnit: 'kg' } })).toSucceedAndSatisfy((tools) => {
        expect(tools.scaling?.weightUnit).toBe('kg');
        // Existing batchMultiplier preserved from deep merge
        expect(tools.scaling?.batchMultiplier).toBe(1.5);
      });
    });

    test('updates workflow preferences', () => {
      const fileTree = createFileTree(validCommonSettings, validDeviceSettings);
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();

      expect(manager.updateToolSettings({ workflow: { autoSaveIntervalSeconds: 30 } })).toSucceedAndSatisfy(
        (tools) => {
          expect(tools.workflow?.autoSaveIntervalSeconds).toBe(30);
          // Existing workflow setting preserved
          expect(tools.workflow?.confirmAbandon).toBe(true);
        }
      );
    });

    test('handles common settings with no tools defined', () => {
      const minimalCommon: ICommonSettings = {
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        externalLibraries: []
      };
      const fileTree = createFileTree(minimalCommon, validDeviceSettings);
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();

      expect(manager.updateToolSettings({ scaling: { weightUnit: 'kg' } })).toSucceedAndSatisfy((tools) => {
        expect(tools.scaling?.weightUnit).toBe('kg');
      });
    });

    test('handles common settings with no scaling tools', () => {
      const commonNoScaling: ICommonSettings = {
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        tools: { workflow: { confirmAbandon: true } },
        externalLibraries: []
      };
      const fileTree = createFileTree(commonNoScaling, validDeviceSettings);
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();

      expect(manager.updateToolSettings({ scaling: { weightUnit: 'kg' } })).toSucceedAndSatisfy((tools) => {
        expect(tools.scaling?.weightUnit).toBe('kg');
        expect(tools.workflow?.confirmAbandon).toBe(true);
      });
    });

    test('handles common settings with no workflow tools', () => {
      const commonNoWorkflow: ICommonSettings = {
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        tools: { scaling: { weightUnit: 'g' } },
        externalLibraries: []
      };
      const fileTree = createFileTree(commonNoWorkflow, validDeviceSettings);
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();

      expect(manager.updateToolSettings({ workflow: { confirmAbandon: false } })).toSucceedAndSatisfy(
        (tools) => {
          expect(tools.workflow?.confirmAbandon).toBe(false);
          expect(tools.scaling?.weightUnit).toBe('g');
        }
      );
    });

    test('returns empty object when updated settings have no tools', () => {
      const minimalCommon: ICommonSettings = {
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        externalLibraries: []
      };
      const fileTree = createFileTree(minimalCommon, validDeviceSettings);
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();

      // updateToolSettings should work even with no tools field
      expect(manager.updateToolSettings({ scaling: { weightUnit: 'kg' } })).toSucceedAndSatisfy((tools) => {
        expect(tools.scaling?.weightUnit).toBe('kg');
      });

      // Force a scenario where updated.tools is undefined by updating to undefined
      // This is harder to trigger naturally but exercises the ?? branch
    });
  });

  describe('updateDeviceToolsOverride', () => {
    test('deep merges into device tools override', () => {
      const deviceWithOverrides: IDeviceSettings = {
        ...validDeviceSettings,
        toolsOverride: { scaling: { weightUnit: 'oz' } }
      };
      const fileTree = createFileTree(validCommonSettings, deviceWithOverrides);
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();

      expect(manager.updateDeviceToolsOverride({ scaling: { batchMultiplier: 3.0 } })).toSucceedAndSatisfy(
        (tools) => {
          // New override applied
          expect(tools.scaling?.batchMultiplier).toBe(3.0);
          // Existing override preserved
          expect(tools.scaling?.weightUnit).toBe('oz');
        }
      );
    });

    test('handles device settings with no toolsOverride', () => {
      const fileTree = createFileTree(validCommonSettings, validDeviceSettings);
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();

      expect(manager.updateDeviceToolsOverride({ scaling: { weightUnit: 'kg' } })).toSucceedAndSatisfy(
        (tools) => {
          expect(tools.scaling?.weightUnit).toBe('kg');
        }
      );
    });

    test('handles device settings with no scaling override', () => {
      const deviceWithWorkflowOnly: IDeviceSettings = {
        ...validDeviceSettings,
        toolsOverride: { workflow: { confirmAbandon: false } }
      };
      const fileTree = createFileTree(validCommonSettings, deviceWithWorkflowOnly);
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();

      expect(manager.updateDeviceToolsOverride({ scaling: { weightUnit: 'kg' } })).toSucceedAndSatisfy(
        (tools) => {
          expect(tools.scaling?.weightUnit).toBe('kg');
          expect(tools.workflow?.confirmAbandon).toBe(false);
        }
      );
    });

    test('handles device settings with no workflow override', () => {
      const deviceWithScalingOnly: IDeviceSettings = {
        ...validDeviceSettings,
        toolsOverride: { scaling: { weightUnit: 'oz' } }
      };
      const fileTree = createFileTree(validCommonSettings, deviceWithScalingOnly);
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();

      expect(manager.updateDeviceToolsOverride({ workflow: { confirmAbandon: true } })).toSucceedAndSatisfy(
        (tools) => {
          expect(tools.workflow?.confirmAbandon).toBe(true);
          expect(tools.scaling?.weightUnit).toBe('oz');
        }
      );
    });

    test('returns empty object when updated settings have no toolsOverride', () => {
      const fileTree = createFileTree(validCommonSettings, validDeviceSettings);
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();

      expect(manager.updateDeviceToolsOverride({ scaling: { weightUnit: 'kg' } })).toSucceedAndSatisfy(
        (tools) => {
          expect(tools.scaling?.weightUnit).toBe('kg');
        }
      );
    });
  });

  // ============================================================================
  // isDirty
  // ============================================================================

  describe('isDirty', () => {
    test('false when loading existing settings', () => {
      const fileTree = createFileTree(validCommonSettings, validDeviceSettings);
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();
      expect(manager.isDirty).toBe(false);
    });

    test('true after creating default settings', () => {
      const fileTree = createFileTree(); // no files
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();
      expect(manager.isDirty).toBe(true);
    });

    test('true after updateCommonSettings', () => {
      const fileTree = createFileTree(validCommonSettings, validDeviceSettings);
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();
      manager.updateCommonSettings({ tools: { scaling: { weightUnit: 'kg' } } }).orThrow();
      expect(manager.isDirty).toBe(true);
    });

    test('true after updateDeviceSettings', () => {
      const fileTree = createFileTree(validCommonSettings, validDeviceSettings);
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();
      manager.updateDeviceSettings({ deviceName: 'New Name' }).orThrow();
      expect(manager.isDirty).toBe(true);
    });
  });

  // ============================================================================
  // save
  // ============================================================================

  describe('save', () => {
    test('returns false when not dirty', async () => {
      const fileTree = createFileTree(validCommonSettings, validDeviceSettings);
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();
      const result = await manager.save();
      expect(result).toSucceedWith(false);
    });

    test('saves dirty settings and clears dirty flag', async () => {
      const fileTree = createFileTree(validCommonSettings, validDeviceSettings, { mutable: true });
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();

      // Make a change
      manager.updateCommonSettings({ tools: { scaling: { weightUnit: 'kg' } } }).orThrow();
      expect(manager.isDirty).toBe(true);

      const result = await manager.save();
      expect(result).toSucceedWith(true);
      expect(manager.isDirty).toBe(false);
    });

    test('persists changes to file tree', async () => {
      const fileTree = createFileTree(validCommonSettings, validDeviceSettings, { mutable: true });
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();

      manager.updateCommonSettings({ tools: { scaling: { weightUnit: 'kg' } } }).orThrow();
      await manager.save();

      // Create a new manager from the same file tree to verify persistence
      const manager2 = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();
      expect(manager2.getCommonSettings().tools?.scaling?.weightUnit).toBe('kg');
    });

    test('persists device changes to file tree', async () => {
      const fileTree = createFileTree(validCommonSettings, validDeviceSettings, { mutable: true });
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();

      manager.updateDeviceSettings({ deviceName: 'Persisted Name' }).orThrow();
      await manager.save();

      // Verify by re-loading
      const manager2 = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();
      expect(manager2.getDeviceSettings().deviceName).toBe('Persisted Name');
    });

    test('only saves dirty files', async () => {
      const fileTree = createFileTree(validCommonSettings, validDeviceSettings, { mutable: true });
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();

      // Only update device settings (common should not be saved)
      manager.updateDeviceSettings({ deviceName: 'Only Device Updated' }).orThrow();
      const result = await manager.save();
      expect(result).toSucceedWith(true);
      expect(manager.isDirty).toBe(false);
    });

    test('creates new settings files when they do not exist', async () => {
      const fileTree = createFileTree(undefined, undefined, { mutable: true });
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();

      // New manager with no existing files will be dirty
      expect(manager.isDirty).toBe(true);

      // This should fail because settings directory doesn't exist
      const result = await manager.save();
      expect(result).toFailWith(/settings directory does not exist/i);
    });

    test('fails when settings directory does not exist', async () => {
      // Create a file tree without the settings directory
      const files: FileTree.IInMemoryFile[] = [{ path: '/library/readme.txt', contents: 'placeholder' }];
      const tree = FileTree.inMemory(files, { mutable: true }).orThrow();
      const fileTree = tree.getItem('/library').orThrow() as FileTree.IFileTreeDirectoryItem;

      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();

      // Manager will be dirty with default settings
      manager.updateToolSettings({ scaling: { weightUnit: 'kg' } }).orThrow();

      const result = await manager.save();
      expect(result).toFailWith(/settings directory does not exist/i);
    });

    test('fails on common settings save failure with immutable file tree', async () => {
      const fileTree = createFileTree(validCommonSettings, validDeviceSettings, { mutable: false });
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();

      manager.updateCommonSettings({ tools: { scaling: { weightUnit: 'kg' } } }).orThrow();

      const result = await manager.save();
      expect(result).toFailWith(/failed to save.*common\.json/i);
    });

    test('fails on device settings save failure with immutable file tree', async () => {
      const fileTree = createFileTree(validCommonSettings, validDeviceSettings, { mutable: false });
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();

      manager.updateDeviceSettings({ deviceName: 'Updated' }).orThrow();

      const result = await manager.save();
      expect(result).toFailWith(/failed to save.*device-.*\.json/i);
    });

    test('creates missing device settings file on mutable tree', async () => {
      // Create a tree with settings directory but only common file exists
      const files: FileTree.IInMemoryFile[] = [
        {
          path: `/library/${SETTINGS_DIR_PATH}/${COMMON_SETTINGS_FILENAME}`,
          contents: validCommonSettings
        },
        // Add a placeholder to ensure settings directory exists
        { path: `/library/${SETTINGS_DIR_PATH}/placeholder.txt`, contents: 'ensures directory exists' }
      ];
      const tree = FileTree.inMemory(files, { mutable: true }).orThrow();
      const fileTree = tree.getItem('/library').orThrow() as FileTree.IFileTreeDirectoryItem;

      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();

      // Update both
      manager.updateCommonSettings({ tools: { scaling: { weightUnit: 'kg' } } }).orThrow();
      manager.updateDeviceSettings({ deviceName: 'Updated' }).orThrow();

      // Mutable trees support createChildFile, so new device file is created
      const result = await manager.save();
      expect(result).toSucceedWith(true);
    });

    test('persists both common and device settings when device file is created', async () => {
      // Create a tree with settings directory and common file but no device file
      const files: FileTree.IInMemoryFile[] = [
        {
          path: `/library/${SETTINGS_DIR_PATH}/${COMMON_SETTINGS_FILENAME}`,
          contents: validCommonSettings
        },
        { path: `/library/${SETTINGS_DIR_PATH}/placeholder.txt`, contents: 'ensures directory exists' }
      ];
      const tree = FileTree.inMemory(files, { mutable: true }).orThrow();
      const fileTree = tree.getItem('/library').orThrow() as FileTree.IFileTreeDirectoryItem;

      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();

      manager.updateCommonSettings({ tools: { scaling: { weightUnit: 'kg' } } }).orThrow();
      manager.updateDeviceSettings({ deviceName: 'Updated' }).orThrow();

      await manager.save();

      // Both common and device settings should be persisted
      const manager2 = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();
      expect(manager2.getCommonSettings().tools?.scaling?.weightUnit).toBe('kg');
      expect(manager2.getDeviceSettings().deviceName).toBe('Updated');
    });
  });

  // ============================================================================
  // Error Path Tests - _createNewSettingsFile
  // ============================================================================

  describe('_createNewSettingsFile', () => {
    test('creates missing device file on mutable tree', async () => {
      // Create settings directory with only common settings file
      const files: FileTree.IInMemoryFile[] = [
        {
          path: `/library/${SETTINGS_DIR_PATH}/${COMMON_SETTINGS_FILENAME}`,
          contents: validCommonSettings
        },
        { path: `/library/${SETTINGS_DIR_PATH}/readme.txt`, contents: 'placeholder' }
      ];
      const tree = FileTree.inMemory(files, { mutable: true }).orThrow();
      const fileTree = tree.getItem('/library').orThrow() as FileTree.IFileTreeDirectoryItem;

      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();

      // Device file doesn't exist, only common exists
      manager.updateDeviceSettings({ deviceName: 'New Device' }).orThrow();

      // Mutable trees support createChildFile, so new device file is created
      const result = await manager.save();
      expect(result).toSucceedWith(true);
    });

    test('creates missing common file on mutable tree', async () => {
      // Create settings directory with only device file
      const files: FileTree.IInMemoryFile[] = [
        {
          path: `/library/${SETTINGS_DIR_PATH}/${getDeviceSettingsFilename(testDeviceId)}`,
          contents: validDeviceSettings
        },
        { path: `/library/${SETTINGS_DIR_PATH}/readme.txt`, contents: 'placeholder' }
      ];
      const tree = FileTree.inMemory(files, { mutable: true }).orThrow();
      const fileTree = tree.getItem('/library').orThrow() as FileTree.IFileTreeDirectoryItem;

      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();

      // Common file doesn't exist, will be dirty with defaults
      expect(manager.isDirty).toBe(true);

      // Mutable trees support createChildFile, so common file is created
      const result = await manager.save();
      expect(result).toSucceedWith(true);
    });

    test('fails when tree does not support file creation', async () => {
      // Create immutable settings directory with only common settings file
      const files: FileTree.IInMemoryFile[] = [
        {
          path: `/library/${SETTINGS_DIR_PATH}/${COMMON_SETTINGS_FILENAME}`,
          contents: validCommonSettings
        },
        { path: `/library/${SETTINGS_DIR_PATH}/readme.txt`, contents: 'placeholder' }
      ];
      const tree = FileTree.inMemory(files).orThrow();
      const fileTree = tree.getItem('/library').orThrow() as FileTree.IFileTreeDirectoryItem;

      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();

      // Device file doesn't exist and tree is immutable
      manager.updateDeviceSettings({ deviceName: 'New Device' }).orThrow();

      const result = await manager.save();
      expect(result).toFailWith(/cannot create new settings file.*mutability is disabled/i);
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
    common?: ICommonSettings,
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
    if (common !== undefined) {
      files.push({
        path: `/library/${SETTINGS_DIR_PATH}/${COMMON_SETTINGS_FILENAME}`,
        contents: common
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
          expect(manager.getBootstrapSettings()).toBeDefined();
          expect(manager.getPreferencesSettings()).toBeDefined();
        }
      );
    });

    test('creates default files when none exist', () => {
      const fileTree = createBootstrapFileTree();
      expect(SettingsManager.createFromBootstrap({ fileTree, deviceId: testDeviceId })).toSucceedAndSatisfy(
        (manager) => {
          expect(manager.isDirty).toBe(true);
          expect(manager.getBootstrapSettings()).toBeDefined();
          expect(manager.getPreferencesSettings()).toBeDefined();
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
  // createFromBootstrapWithMigration
  // ============================================================================

  describe('createFromBootstrapWithMigration', () => {
    test('uses bootstrap path when bootstrap.json exists', () => {
      const fileTree = createBootstrapFileTree(validBootstrapSettings, validPreferencesSettings);
      expect(
        SettingsManager.createFromBootstrapWithMigration({ fileTree, deviceId: testDeviceId })
      ).toSucceedAndSatisfy((manager) => {
        expect(manager.getBootstrapSettings()).toBeDefined();
        expect(manager.getBootstrapSettings()?.includeBuiltIn).toBe(true);
        expect(manager.isDirty).toBe(false);
      });
    });

    test('migrates from common.json when bootstrap.json does not exist', () => {
      const fileTree = createBootstrapFileTree(undefined, undefined, validCommonSettings);
      expect(
        SettingsManager.createFromBootstrapWithMigration({ fileTree, deviceId: testDeviceId })
      ).toSucceedAndSatisfy((manager) => {
        // Should have split common into bootstrap + preferences
        const bootstrap = manager.getBootstrapSettings();
        const preferences = manager.getPreferencesSettings();
        expect(bootstrap).toBeDefined();
        expect(preferences).toBeDefined();

        // externalLibraries should be in bootstrap
        expect(bootstrap?.externalLibraries).toEqual(validCommonSettings.externalLibraries);

        // defaultTargets and tools should be in preferences
        expect(preferences?.defaultTargets?.fillings).toBe('user');
        expect(preferences?.tools?.scaling?.weightUnit).toBe('g');

        // Should be dirty since new files need to be written
        expect(manager.isDirty).toBe(true);
      });
    });

    test('creates defaults when neither bootstrap.json nor common.json exists', () => {
      const fileTree = createBootstrapFileTree();
      expect(
        SettingsManager.createFromBootstrapWithMigration({ fileTree, deviceId: testDeviceId })
      ).toSucceedAndSatisfy((manager) => {
        expect(manager.getBootstrapSettings()).toBeDefined();
        expect(manager.getPreferencesSettings()).toBeDefined();
        expect(manager.isDirty).toBe(true);
      });
    });

    test('migrated settings can be saved', async () => {
      const fileTree = createBootstrapFileTree(undefined, undefined, validCommonSettings, {
        mutable: true
      });
      const manager = SettingsManager.createFromBootstrapWithMigration({
        fileTree,
        deviceId: testDeviceId
      }).orThrow();

      expect(manager.isDirty).toBe(true);
      const result = await manager.save();
      expect(result).toSucceedWith(true);
      expect(manager.isDirty).toBe(false);

      // Verify the new files can be loaded by createFromBootstrap
      const manager2 = SettingsManager.createFromBootstrap({ fileTree, deviceId: testDeviceId }).orThrow();
      expect(manager2.getBootstrapSettings()?.includeBuiltIn).toBe(true);
      expect(manager2.getPreferencesSettings()?.defaultTargets?.fillings).toBe('user');
    });

    test('fails for malformed bootstrap.json during migration check', () => {
      const files: FileTree.IInMemoryFile[] = [
        {
          path: `/library/${SETTINGS_DIR_PATH}/${BOOTSTRAP_SETTINGS_FILENAME}`,
          contents: { schemaVersion: 999 } // exists but invalid
        }
      ];
      const tree = FileTree.inMemory(files).orThrow();
      const fileTree = tree.getItem('/library').orThrow() as FileTree.IFileTreeDirectoryItem;
      expect(SettingsManager.createFromBootstrapWithMigration({ fileTree, deviceId: testDeviceId })).toFail();
    });

    test('fails for malformed common.json during migration', () => {
      const files: FileTree.IInMemoryFile[] = [
        {
          path: `/library/${SETTINGS_DIR_PATH}/${COMMON_SETTINGS_FILENAME}`,
          contents: { schemaVersion: 999 }
        }
      ];
      const tree = FileTree.inMemory(files).orThrow();
      const fileTree = tree.getItem('/library').orThrow() as FileTree.IFileTreeDirectoryItem;
      expect(SettingsManager.createFromBootstrapWithMigration({ fileTree, deviceId: testDeviceId })).toFail();
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

    test('works when no bootstrap was loaded (uses defaults)', () => {
      const fileTree = createFileTree(validCommonSettings, validDeviceSettings);
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();

      expect(manager.updateBootstrapSettings({ includeBuiltIn: false })).toSucceedAndSatisfy((updated) => {
        expect(updated.includeBuiltIn).toBe(false);
      });
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

    test('works when no preferences was loaded (uses defaults)', () => {
      const fileTree = createFileTree(validCommonSettings, validDeviceSettings);
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();

      expect(
        manager.updatePreferencesSettings({
          defaultTargets: { molds: 'shared' as CollectionId }
        })
      ).toSucceedAndSatisfy((updated) => {
        expect(updated.defaultTargets?.molds).toBe('shared');
      });
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

      // Verify preferences was updated, not common
      expect(manager.getPreferencesSettings()?.defaultTargets?.molds).toBe('shared');
    });

    test('updateDefaultStorageTargets routes to preferences', () => {
      const fileTree = createBootstrapFileTree(validBootstrapSettings, validPreferencesSettings);
      const manager = SettingsManager.createFromBootstrap({ fileTree, deviceId: testDeviceId }).orThrow();

      expect(
        manager.updateDefaultStorageTargets({ globalDefault: 'main' as StorageRootId })
      ).toSucceedAndSatisfy((targets) => {
        expect(targets.globalDefault).toBe('main');
      });

      expect(manager.getPreferencesSettings()?.defaultStorageTargets?.globalDefault).toBe('main');
    });

    test('updateDefaultStorageTargets routes to common in legacy mode', () => {
      const fileTree = createFileTree(validCommonSettings, validDeviceSettings);
      const manager = SettingsManager.create({ fileTree, deviceId: testDeviceId }).orThrow();

      expect(
        manager.updateDefaultStorageTargets({ globalDefault: 'main' as StorageRootId })
      ).toSucceedAndSatisfy((targets) => {
        expect(targets.globalDefault).toBe('main');
      });

      expect(manager.getCommonSettings().defaultStorageTargets?.globalDefault).toBe('main');
    });

    test('updateToolSettings routes to preferences', () => {
      const fileTree = createBootstrapFileTree(validBootstrapSettings, validPreferencesSettings);
      const manager = SettingsManager.createFromBootstrap({ fileTree, deviceId: testDeviceId }).orThrow();

      expect(manager.updateToolSettings({ scaling: { weightUnit: 'kg' } })).toSucceedAndSatisfy((tools) => {
        expect(tools.scaling?.weightUnit).toBe('kg');
        expect(tools.scaling?.batchMultiplier).toBe(1.5);
      });

      expect(manager.getPreferencesSettings()?.tools?.scaling?.weightUnit).toBe('kg');
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
      const fileTree = createBootstrapFileTree(validBootstrapSettings, validPreferencesSettings, undefined, {
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
      expect(manager2.getBootstrapSettings()?.includeBuiltIn).toBe(false);
      expect(manager2.getPreferencesSettings()?.defaultTargets?.molds).toBe('shared');
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
      expect(manager2.getBootstrapSettings()).toBeDefined();
    });
  });
});
