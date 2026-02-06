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
  createDefaultCommonSettings,
  createDefaultDeviceSettings,
  ICommonSettings,
  IDeviceSettings,
  DeviceId,
  DEFAULT_SCALING,
  DEFAULT_WORKFLOW,
  DEFAULT_TOOL_SETTINGS,
  SETTINGS_SCHEMA_VERSION
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
        autoExpandIngredients: false
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
  // resolveSettings
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
