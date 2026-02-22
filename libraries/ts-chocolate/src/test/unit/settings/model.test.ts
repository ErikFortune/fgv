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
  resolvePreferencesSettings,
  createDefaultBootstrapSettings,
  createDefaultPreferencesSettings,
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
        defaultStorageTargets: { libraryDefault: 'main' as StorageRootId }
      };
      const resolved = resolvePreferencesSettings(prefs, testDeviceId);
      expect(resolved.defaultStorageTargets?.libraryDefault).toBe('main');
    });
  });
});
