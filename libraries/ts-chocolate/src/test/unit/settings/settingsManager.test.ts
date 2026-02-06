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
  ICommonSettings,
  IDeviceSettings,
  SETTINGS_SCHEMA_VERSION,
  getDeviceSettingsFilename,
  SETTINGS_DIR_PATH,
  COMMON_SETTINGS_FILENAME,
  DEVICE_SETTINGS_PREFIX,
  DEVICE_SETTINGS_SUFFIX
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
  });
});
