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

import {
  resolveSettings,
  resolvePreferencesSettings,
  createDefaultCommonSettings,
  createDefaultDeviceSettings,
  createDefaultBootstrapSettings,
  createDefaultPreferencesSettings,
  splitCommonSettings,
  ICommonSettings,
  IDeviceSettings,
  IPreferencesSettings,
  DeviceId,
  DEFAULT_SCALING,
  DEFAULT_WORKFLOW,
  DEFAULT_TOOL_SETTINGS,
  SETTINGS_SCHEMA_VERSION,
  type StorageRootId
} from '../../../packlets/settings';
import { CollectionId } from '../../../packlets/common';

describe('settings model', () => {
  // ============================================================================
  // Constants
  // ============================================================================

  describe('constants', () => {
    test('SETTINGS_SCHEMA_VERSION is 1', () => {
      expect(SETTINGS_SCHEMA_VERSION).toBe(1);
    });

    test('DEFAULT_SCALING has expected values', () => {
      expect(DEFAULT_SCALING).toEqual({
        weightUnit: 'g',
        measurementUnit: 'g',
        batchMultiplier: 1.0,
        bufferPercentage: 0.1
      });
    });

    test('DEFAULT_WORKFLOW has expected values', () => {
      expect(DEFAULT_WORKFLOW).toEqual({
        autoSaveIntervalSeconds: 60,
        confirmAbandon: true,
        showPercentages: true,
        autoExpandIngredients: false,
        adaptedRecipeNameSuffix: ' (adapted)'
      });
    });

    test('DEFAULT_TOOL_SETTINGS contains scaling and workflow defaults', () => {
      expect(DEFAULT_TOOL_SETTINGS).toEqual({
        scaling: DEFAULT_SCALING,
        workflow: DEFAULT_WORKFLOW
      });
    });
  });

  // ============================================================================
  // createDefaultCommonSettings
  // ============================================================================

  describe('createDefaultCommonSettings', () => {
    test('returns common settings with correct schema version', () => {
      const settings = createDefaultCommonSettings();
      expect(settings.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
    });

    test('returns empty default targets', () => {
      const settings = createDefaultCommonSettings();
      expect(settings.defaultTargets).toEqual({});
    });

    test('returns DEFAULT_TOOL_SETTINGS as tools', () => {
      const settings = createDefaultCommonSettings();
      expect(settings.tools).toEqual(DEFAULT_TOOL_SETTINGS);
    });

    test('returns empty external libraries array', () => {
      const settings = createDefaultCommonSettings();
      expect(settings.externalLibraries).toEqual([]);
    });
  });

  // ============================================================================
  // createDefaultDeviceSettings
  // ============================================================================

  describe('createDefaultDeviceSettings', () => {
    test('returns device settings with correct schema version and device ID', () => {
      const deviceId = 'test-device' as unknown as DeviceId;
      const settings = createDefaultDeviceSettings(deviceId);
      expect(settings.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
      expect(settings.deviceId).toBe(deviceId);
    });

    test('includes device name when provided', () => {
      const deviceId = 'test-device' as unknown as DeviceId;
      const settings = createDefaultDeviceSettings(deviceId, 'My Test Device');
      expect(settings.deviceName).toBe('My Test Device');
    });

    test('device name is undefined when omitted', () => {
      const deviceId = 'test-device' as unknown as DeviceId;
      const settings = createDefaultDeviceSettings(deviceId);
      expect(settings.deviceName).toBeUndefined();
    });
  });

  // ============================================================================
  // createDefaultBootstrapSettings
  // ============================================================================

  describe('createDefaultBootstrapSettings', () => {
    test('returns bootstrap settings with correct schema version', () => {
      const settings = createDefaultBootstrapSettings();
      expect(settings.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
    });

    test('includes built-in by default', () => {
      const settings = createDefaultBootstrapSettings();
      expect(settings.includeBuiltIn).toBe(true);
    });

    test('enables all localStorage by default', () => {
      const settings = createDefaultBootstrapSettings();
      expect(settings.localStorage).toEqual({ library: true, userData: true });
    });

    test('returns empty external libraries array', () => {
      const settings = createDefaultBootstrapSettings();
      expect(settings.externalLibraries).toEqual([]);
    });

    test('omits optional location fields', () => {
      const settings = createDefaultBootstrapSettings();
      expect(settings.preferencesLocation).toBeUndefined();
      expect(settings.keystoreLocation).toBeUndefined();
      expect(settings.fileTreeOverrides).toBeUndefined();
    });
  });

  // ============================================================================
  // createDefaultPreferencesSettings
  // ============================================================================

  describe('createDefaultPreferencesSettings', () => {
    test('returns preferences settings with correct schema version', () => {
      const settings = createDefaultPreferencesSettings();
      expect(settings.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
    });

    test('returns empty default targets', () => {
      const settings = createDefaultPreferencesSettings();
      expect(settings.defaultTargets).toEqual({});
    });

    test('returns DEFAULT_TOOL_SETTINGS as tools', () => {
      const settings = createDefaultPreferencesSettings();
      expect(settings.tools).toEqual(DEFAULT_TOOL_SETTINGS);
    });

    test('omits defaultStorageTargets', () => {
      const settings = createDefaultPreferencesSettings();
      expect(settings.defaultStorageTargets).toBeUndefined();
    });
  });

  // ============================================================================
  // splitCommonSettings
  // ============================================================================

  describe('splitCommonSettings', () => {
    test('splits externalLibraries into bootstrap', () => {
      const common: ICommonSettings = {
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        externalLibraries: [{ name: 'Lib', ref: '/path' as never }]
      };
      const { bootstrap } = splitCommonSettings(common);
      expect(bootstrap.externalLibraries).toHaveLength(1);
      expect(bootstrap.externalLibraries![0].name).toBe('Lib');
    });

    test('splits defaultTargets into preferences', () => {
      const common: ICommonSettings = {
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        defaultTargets: { fillings: 'user' as CollectionId }
      };
      const { preferences } = splitCommonSettings(common);
      expect(preferences.defaultTargets?.fillings).toBe('user');
    });

    test('splits defaultStorageTargets into preferences', () => {
      const common: ICommonSettings = {
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        defaultStorageTargets: { globalDefault: 'main' as StorageRootId }
      };
      const { preferences } = splitCommonSettings(common);
      expect(preferences.defaultStorageTargets?.globalDefault).toBe('main');
    });

    test('splits tools into preferences', () => {
      const common: ICommonSettings = {
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        tools: { scaling: { weightUnit: 'oz' } }
      };
      const { preferences } = splitCommonSettings(common);
      expect(preferences.tools?.scaling?.weightUnit).toBe('oz');
    });

    test('bootstrap gets default includeBuiltIn and localStorage', () => {
      const common: ICommonSettings = { schemaVersion: SETTINGS_SCHEMA_VERSION };
      const { bootstrap } = splitCommonSettings(common);
      expect(bootstrap.includeBuiltIn).toBe(true);
      expect(bootstrap.localStorage).toEqual({ library: true, userData: true });
    });

    test('both outputs have correct schemaVersion', () => {
      const common: ICommonSettings = { schemaVersion: SETTINGS_SCHEMA_VERSION };
      const { bootstrap, preferences } = splitCommonSettings(common);
      expect(bootstrap.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
      expect(preferences.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
    });

    test('minimal common produces valid split', () => {
      const common: ICommonSettings = { schemaVersion: SETTINGS_SCHEMA_VERSION };
      const { bootstrap, preferences } = splitCommonSettings(common);
      expect(bootstrap.externalLibraries).toBeUndefined();
      expect(preferences.defaultTargets).toBeUndefined();
      expect(preferences.tools).toBeUndefined();
    });
  });

  // ============================================================================
  // resolvePreferencesSettings
  // ============================================================================

  describe('resolvePreferencesSettings', () => {
    const testDeviceId = 'test-device' as unknown as DeviceId;

    test('uses supplied deviceId', () => {
      const prefs: IPreferencesSettings = { schemaVersion: SETTINGS_SCHEMA_VERSION };
      const resolved = resolvePreferencesSettings(prefs, testDeviceId);
      expect(resolved.deviceId).toBe(testDeviceId);
    });

    test('uses defaultTargets from preferences', () => {
      const prefs: IPreferencesSettings = {
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        defaultTargets: { fillings: 'user' as CollectionId }
      };
      const resolved = resolvePreferencesSettings(prefs, testDeviceId);
      expect(resolved.defaultTargets.fillings).toBe('user');
    });

    test('falls back to empty defaultTargets when not set', () => {
      const prefs: IPreferencesSettings = { schemaVersion: SETTINGS_SCHEMA_VERSION };
      const resolved = resolvePreferencesSettings(prefs, testDeviceId);
      expect(resolved.defaultTargets).toEqual({});
    });

    test('applies DEFAULT_SCALING as base for tools.scaling', () => {
      const prefs: IPreferencesSettings = { schemaVersion: SETTINGS_SCHEMA_VERSION };
      const resolved = resolvePreferencesSettings(prefs, testDeviceId);
      expect(resolved.tools.scaling).toEqual(DEFAULT_SCALING);
    });

    test('applies DEFAULT_WORKFLOW as base for tools.workflow', () => {
      const prefs: IPreferencesSettings = { schemaVersion: SETTINGS_SCHEMA_VERSION };
      const resolved = resolvePreferencesSettings(prefs, testDeviceId);
      expect(resolved.tools.workflow).toEqual(DEFAULT_WORKFLOW);
    });

    test('preferences tools.scaling overrides defaults', () => {
      const prefs: IPreferencesSettings = {
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        tools: { scaling: { weightUnit: 'oz', batchMultiplier: 2.0 } }
      };
      const resolved = resolvePreferencesSettings(prefs, testDeviceId);
      expect(resolved.tools.scaling?.weightUnit).toBe('oz');
      expect(resolved.tools.scaling?.batchMultiplier).toBe(2.0);
      expect(resolved.tools.scaling?.bufferPercentage).toBe(DEFAULT_SCALING.bufferPercentage);
    });

    test('preferences tools.workflow overrides defaults', () => {
      const prefs: IPreferencesSettings = {
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        tools: { workflow: { confirmAbandon: false, autoSaveIntervalSeconds: 120 } }
      };
      const resolved = resolvePreferencesSettings(prefs, testDeviceId);
      expect(resolved.tools.workflow?.confirmAbandon).toBe(false);
      expect(resolved.tools.workflow?.autoSaveIntervalSeconds).toBe(120);
    });

    test('passes through defaultStorageTargets', () => {
      const prefs: IPreferencesSettings = {
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        defaultStorageTargets: { globalDefault: 'main' as StorageRootId }
      };
      const resolved = resolvePreferencesSettings(prefs, testDeviceId);
      expect(resolved.defaultStorageTargets?.globalDefault).toBe('main');
    });

    test('does not include lastActiveSessionId', () => {
      const prefs: IPreferencesSettings = { schemaVersion: SETTINGS_SCHEMA_VERSION };
      const resolved = resolvePreferencesSettings(prefs, testDeviceId);
      expect(resolved.lastActiveSessionId).toBeUndefined();
    });
  });

  // ============================================================================
  // resolveSettings (legacy)
  // ============================================================================

  describe('resolveSettings', () => {
    const baseCommon: ICommonSettings = {
      schemaVersion: SETTINGS_SCHEMA_VERSION,
      defaultTargets: {
        fillings: 'user' as CollectionId,
        ingredients: 'user' as CollectionId
      },
      tools: {
        scaling: {
          weightUnit: 'oz',
          batchMultiplier: 2.0
        },
        workflow: {
          autoSaveIntervalSeconds: 120,
          confirmAbandon: false
        }
      }
    };

    const baseDevice: IDeviceSettings = {
      schemaVersion: SETTINGS_SCHEMA_VERSION,
      deviceId: 'my-device' as unknown as DeviceId
    };

    test('uses device ID from device settings', () => {
      const resolved = resolveSettings(baseCommon, baseDevice);
      expect(resolved.deviceId).toBe(baseDevice.deviceId);
    });

    test('merges common default targets when device has no overrides', () => {
      const resolved = resolveSettings(baseCommon, baseDevice);
      expect(resolved.defaultTargets.fillings).toBe('user');
      expect(resolved.defaultTargets.ingredients).toBe('user');
    });

    test('device defaultTargetsOverride takes precedence over common', () => {
      const device: IDeviceSettings = {
        ...baseDevice,
        defaultTargetsOverride: {
          fillings: 'device-local' as CollectionId
        }
      };
      const resolved = resolveSettings(baseCommon, device);
      expect(resolved.defaultTargets.fillings).toBe('device-local');
      // Common-only targets still present
      expect(resolved.defaultTargets.ingredients).toBe('user');
    });

    test('applies DEFAULT_SCALING as base layer for tools.scaling', () => {
      const minimalCommon: ICommonSettings = { schemaVersion: SETTINGS_SCHEMA_VERSION };
      const resolved = resolveSettings(minimalCommon, baseDevice);
      expect(resolved.tools.scaling).toEqual(DEFAULT_SCALING);
    });

    test('applies DEFAULT_WORKFLOW as base layer for tools.workflow', () => {
      const minimalCommon: ICommonSettings = { schemaVersion: SETTINGS_SCHEMA_VERSION };
      const resolved = resolveSettings(minimalCommon, baseDevice);
      expect(resolved.tools.workflow).toEqual(DEFAULT_WORKFLOW);
    });

    test('common tools.scaling overrides DEFAULT_SCALING', () => {
      const resolved = resolveSettings(baseCommon, baseDevice);
      expect(resolved.tools.scaling?.weightUnit).toBe('oz');
      expect(resolved.tools.scaling?.batchMultiplier).toBe(2.0);
      // Defaults still present for fields not overridden
      expect(resolved.tools.scaling?.bufferPercentage).toBe(DEFAULT_SCALING.bufferPercentage);
    });

    test('device toolsOverride.scaling overrides common tools.scaling', () => {
      const device: IDeviceSettings = {
        ...baseDevice,
        toolsOverride: {
          scaling: { weightUnit: 'kg' }
        }
      };
      const resolved = resolveSettings(baseCommon, device);
      expect(resolved.tools.scaling?.weightUnit).toBe('kg');
      // Common override still present for fields not overridden by device
      expect(resolved.tools.scaling?.batchMultiplier).toBe(2.0);
    });

    test('device toolsOverride.workflow overrides common tools.workflow', () => {
      const device: IDeviceSettings = {
        ...baseDevice,
        toolsOverride: {
          workflow: { confirmAbandon: true }
        }
      };
      const resolved = resolveSettings(baseCommon, device);
      expect(resolved.tools.workflow?.confirmAbandon).toBe(true);
      // Common override still present
      expect(resolved.tools.workflow?.autoSaveIntervalSeconds).toBe(120);
    });

    test('lastActiveSessionId passes through from device', () => {
      const device: IDeviceSettings = {
        ...baseDevice,
        lastActiveSessionId: 'session-abc'
      };
      const resolved = resolveSettings(baseCommon, device);
      expect(resolved.lastActiveSessionId).toBe('session-abc');
    });

    test('lastActiveSessionId is undefined when not set', () => {
      const resolved = resolveSettings(baseCommon, baseDevice);
      expect(resolved.lastActiveSessionId).toBeUndefined();
    });

    test('minimal settings resolve with all defaults', () => {
      const minimalCommon: ICommonSettings = { schemaVersion: SETTINGS_SCHEMA_VERSION };
      const minimalDevice: IDeviceSettings = {
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        deviceId: 'dev' as unknown as DeviceId
      };
      const resolved = resolveSettings(minimalCommon, minimalDevice);
      expect(resolved.deviceId).toBe('dev');
      expect(resolved.defaultTargets).toEqual({});
      expect(resolved.tools.scaling).toEqual(DEFAULT_SCALING);
      expect(resolved.tools.workflow).toEqual(DEFAULT_WORKFLOW);
      expect(resolved.lastActiveSessionId).toBeUndefined();
    });
  });
});
