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

import {
  Converters,
  DEVICE_ID_PATTERN,
  SETTINGS_SCHEMA_VERSION,
  DeviceId,
  ExternalLibraryRef
} from '../../../packlets/settings';

describe('settings converters', () => {
  // ============================================================================
  // DEVICE_ID_PATTERN
  // ============================================================================

  describe('DEVICE_ID_PATTERN', () => {
    test('matches alphanumeric with dashes and underscores', () => {
      expect(DEVICE_ID_PATTERN.test('my-device')).toBe(true);
      expect(DEVICE_ID_PATTERN.test('DEVICE_01')).toBe(true);
      expect(DEVICE_ID_PATTERN.test('abc123')).toBe(true);
    });

    test('rejects dots and spaces', () => {
      expect(DEVICE_ID_PATTERN.test('a.b')).toBe(false);
      expect(DEVICE_ID_PATTERN.test('a b')).toBe(false);
      expect(DEVICE_ID_PATTERN.test('')).toBe(false);
    });
  });

  // ============================================================================
  // deviceId converter
  // ============================================================================

  describe('deviceId', () => {
    test('converts valid device IDs', () => {
      expect(Converters.deviceId.convert('my-device')).toSucceedWith('my-device' as unknown as DeviceId);
      expect(Converters.deviceId.convert('DEVICE_01')).toSucceedWith('DEVICE_01' as unknown as DeviceId);
      expect(Converters.deviceId.convert('abc123')).toSucceedWith('abc123' as unknown as DeviceId);
    });

    test('fails for empty string', () => {
      expect(Converters.deviceId.convert('')).toFailWith(/invalid device id/i);
    });

    test('fails for string with dots', () => {
      expect(Converters.deviceId.convert('a.b')).toFailWith(/invalid device id/i);
    });

    test('fails for string with spaces', () => {
      expect(Converters.deviceId.convert('a b')).toFailWith(/invalid device id/i);
    });

    test('fails for non-string input', () => {
      expect(Converters.deviceId.convert(123)).toFail();
    });
  });

  // ============================================================================
  // externalLibraryRef converter
  // ============================================================================

  describe('externalLibraryRef', () => {
    test('converts non-empty strings', () => {
      expect(Converters.externalLibraryRef.convert('/path/to/lib')).toSucceedWith(
        '/path/to/lib' as unknown as ExternalLibraryRef
      );
      expect(Converters.externalLibraryRef.convert('https://example.com/lib')).toSucceedWith(
        'https://example.com/lib' as unknown as ExternalLibraryRef
      );
    });

    test('fails for empty string', () => {
      expect(Converters.externalLibraryRef.convert('')).toFailWith(/cannot be empty/i);
    });

    test('fails for non-string input', () => {
      expect(Converters.externalLibraryRef.convert(42)).toFail();
    });
  });

  // ============================================================================
  // scalingDefaults converter
  // ============================================================================

  describe('scalingDefaults', () => {
    test('converts full object', () => {
      const input = {
        weightUnit: 'g',
        measurementUnit: 'mL',
        batchMultiplier: 2.0,
        bufferPercentage: 15
      };
      expect(Converters.scalingDefaults.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.weightUnit).toBe('g');
        expect(result.measurementUnit).toBe('mL');
        expect(result.batchMultiplier).toBe(2.0);
        expect(result.bufferPercentage).toBe(15);
      });
    });

    test('converts empty object (all fields optional)', () => {
      expect(Converters.scalingDefaults.convert({})).toSucceed();
    });

    test('fails for invalid weightUnit', () => {
      expect(Converters.scalingDefaults.convert({ weightUnit: 'invalid' })).toFail();
    });

    test('fails for non-number batchMultiplier', () => {
      expect(Converters.scalingDefaults.convert({ batchMultiplier: 'two' })).toFail();
    });
  });

  // ============================================================================
  // workflowPreferences converter
  // ============================================================================

  describe('workflowPreferences', () => {
    test('converts full object', () => {
      const input = {
        autoSaveIntervalSeconds: 30,
        confirmAbandon: false,
        showPercentages: true,
        autoExpandIngredients: true
      };
      expect(Converters.workflowPreferences.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.autoSaveIntervalSeconds).toBe(30);
        expect(result.confirmAbandon).toBe(false);
        expect(result.showPercentages).toBe(true);
        expect(result.autoExpandIngredients).toBe(true);
      });
    });

    test('converts empty object', () => {
      expect(Converters.workflowPreferences.convert({})).toSucceed();
    });

    test('fails for non-boolean confirmAbandon', () => {
      expect(Converters.workflowPreferences.convert({ confirmAbandon: 'yes' })).toFail();
    });

    test('fails for non-number autoSaveIntervalSeconds', () => {
      expect(Converters.workflowPreferences.convert({ autoSaveIntervalSeconds: true })).toFail();
    });
  });

  // ============================================================================
  // toolSettings converter
  // ============================================================================

  describe('toolSettings', () => {
    test('converts full nested object', () => {
      const input = {
        scaling: { weightUnit: 'g', batchMultiplier: 1.5 },
        workflow: { confirmAbandon: true }
      };
      expect(Converters.toolSettings.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.scaling?.weightUnit).toBe('g');
        expect(result.workflow?.confirmAbandon).toBe(true);
      });
    });

    test('converts empty object', () => {
      expect(Converters.toolSettings.convert({})).toSucceed();
    });

    test('converts with only scaling', () => {
      expect(Converters.toolSettings.convert({ scaling: { weightUnit: 'oz' } })).toSucceedAndSatisfy(
        (result) => {
          expect(result.scaling?.weightUnit).toBe('oz');
          expect(result.workflow).toBeUndefined();
        }
      );
    });

    test('converts with only workflow', () => {
      expect(Converters.toolSettings.convert({ workflow: { confirmAbandon: false } })).toSucceedAndSatisfy(
        (result) => {
          expect(result.scaling).toBeUndefined();
          expect(result.workflow?.confirmAbandon).toBe(false);
        }
      );
    });
  });

  // ============================================================================
  // defaultCollectionTargets converter
  // ============================================================================

  describe('defaultCollectionTargets', () => {
    test('converts full object with all targets', () => {
      const input = {
        journals: 'user',
        sessions: 'user',
        fillings: 'local',
        confections: 'local',
        ingredients: 'user',
        molds: 'user',
        procedures: 'user',
        tasks: 'user'
      };
      expect(Converters.defaultCollectionTargets.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.journals).toBe('user');
        expect(result.fillings).toBe('local');
      });
    });

    test('converts empty object', () => {
      expect(Converters.defaultCollectionTargets.convert({})).toSucceed();
    });

    test('converts partial object', () => {
      expect(Converters.defaultCollectionTargets.convert({ fillings: 'user' })).toSucceedAndSatisfy(
        (result) => {
          expect(result.fillings).toBe('user');
          expect(result.journals).toBeUndefined();
        }
      );
    });
  });

  // ============================================================================
  // externalLibraryRefConfig converter
  // ============================================================================

  describe('externalLibraryRefConfig', () => {
    test('converts full config with load: true', () => {
      const input = {
        name: 'Shared Library',
        ref: '/path/to/shared',
        load: true,
        mutable: false
      };
      expect(Converters.externalLibraryRefConfig.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.name).toBe('Shared Library');
        expect(result.ref).toBe('/path/to/shared');
        expect(result.load).toBe(true);
        expect(result.mutable).toBe(false);
      });
    });

    test('converts with load: false', () => {
      const input = { name: 'Lib', ref: '/path', load: false };
      expect(Converters.externalLibraryRefConfig.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.load).toBe(false);
      });
    });

    test('converts with per-sublibrary load record', () => {
      const input = {
        name: 'Lib',
        ref: '/path',
        load: { ingredients: true, fillings: false, default: true }
      };
      expect(Converters.externalLibraryRefConfig.convert(input)).toSucceedAndSatisfy((result) => {
        const load = result.load as Record<string, boolean>;
        expect(load.ingredients).toBe(true);
        expect(load.fillings).toBe(false);
        expect(load.default).toBe(true);
      });
    });

    test('converts minimal config (only name and ref)', () => {
      const input = { name: 'Lib', ref: '/path' };
      expect(Converters.externalLibraryRefConfig.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.name).toBe('Lib');
        expect(result.ref).toBe('/path');
        expect(result.load).toBeUndefined();
        expect(result.mutable).toBeUndefined();
      });
    });

    test('fails when name is missing', () => {
      expect(Converters.externalLibraryRefConfig.convert({ ref: '/path' })).toFail();
    });

    test('fails when ref is missing', () => {
      expect(Converters.externalLibraryRefConfig.convert({ name: 'Lib' })).toFail();
    });

    test('fails when ref is empty string', () => {
      expect(Converters.externalLibraryRefConfig.convert({ name: 'Lib', ref: '' })).toFail();
    });

    test('fails for invalid sublibrary ID in load record', () => {
      const input = {
        name: 'Lib',
        ref: '/path',
        load: { notASubLibrary: true }
      };
      expect(Converters.externalLibraryRefConfig.convert(input)).toFail();
    });

    test('fails for non-boolean value in load record', () => {
      const input = {
        name: 'Lib',
        ref: '/path',
        load: { ingredients: 'yes' }
      };
      expect(Converters.externalLibraryRefConfig.convert(input)).toFail();
    });

    test('fails when load is a non-object (string)', () => {
      const input = {
        name: 'Lib',
        ref: '/path',
        load: 'invalid-string'
      };
      expect(Converters.externalLibraryRefConfig.convert(input)).toFailWith(/expected object/i);
    });

    test('fails when load is a non-object (number)', () => {
      const input = {
        name: 'Lib',
        ref: '/path',
        load: 42
      };
      expect(Converters.externalLibraryRefConfig.convert(input)).toFailWith(/expected object/i);
    });
  });

  // ============================================================================
  // commonSettings converter
  // ============================================================================

  describe('commonSettings', () => {
    test('converts full settings object', () => {
      const input = {
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        defaultTargets: { fillings: 'user' },
        tools: {
          scaling: { weightUnit: 'g' },
          workflow: { confirmAbandon: true }
        },
        externalLibraries: [{ name: 'Lib', ref: '/path' }]
      };
      expect(Converters.commonSettings.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
        expect(result.defaultTargets?.fillings).toBe('user');
        expect(result.tools?.scaling?.weightUnit).toBe('g');
        expect(result.externalLibraries).toHaveLength(1);
      });
    });

    test('converts minimal settings (only schemaVersion)', () => {
      const input = { schemaVersion: SETTINGS_SCHEMA_VERSION };
      expect(Converters.commonSettings.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
        expect(result.defaultTargets).toBeUndefined();
        expect(result.tools).toBeUndefined();
        expect(result.externalLibraries).toBeUndefined();
      });
    });

    test('fails for wrong schemaVersion', () => {
      expect(Converters.commonSettings.convert({ schemaVersion: 999 })).toFail();
    });

    test('fails when schemaVersion is missing', () => {
      expect(Converters.commonSettings.convert({})).toFail();
    });
  });

  // ============================================================================
  // deviceSettings converter
  // ============================================================================

  describe('deviceSettings', () => {
    test('converts full device settings', () => {
      const input = {
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        deviceId: 'my-device',
        deviceName: 'My Device',
        lastActiveSessionId: 'session-123',
        defaultTargetsOverride: { fillings: 'device-local' },
        toolsOverride: {
          scaling: { weightUnit: 'oz' }
        },
        fileTreeOverrides: {
          userLibraryPath: '/custom/path',
          keyStorePath: '/custom/keys'
        }
      };
      expect(Converters.deviceSettings.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
        expect(result.deviceId).toBe('my-device');
        expect(result.deviceName).toBe('My Device');
        expect(result.lastActiveSessionId).toBe('session-123');
        expect(result.defaultTargetsOverride?.fillings).toBe('device-local');
        expect(result.toolsOverride?.scaling?.weightUnit).toBe('oz');
        expect(result.fileTreeOverrides?.userLibraryPath).toBe('/custom/path');
      });
    });

    test('converts minimal device settings (schemaVersion + deviceId)', () => {
      const input = {
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        deviceId: 'dev-01'
      };
      expect(Converters.deviceSettings.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
        expect(result.deviceId).toBe('dev-01');
        expect(result.deviceName).toBeUndefined();
      });
    });

    test('fails when deviceId is missing', () => {
      expect(Converters.deviceSettings.convert({ schemaVersion: SETTINGS_SCHEMA_VERSION })).toFail();
    });

    test('fails for invalid deviceId', () => {
      expect(
        Converters.deviceSettings.convert({
          schemaVersion: SETTINGS_SCHEMA_VERSION,
          deviceId: 'has.dots'
        })
      ).toFail();
    });

    test('fails for wrong schemaVersion', () => {
      expect(Converters.deviceSettings.convert({ schemaVersion: 99, deviceId: 'dev' })).toFail();
    });
  });

  // ============================================================================
  // deviceFileTreeOverrides converter
  // ============================================================================

  describe('deviceFileTreeOverrides', () => {
    test('converts full object', () => {
      const input = {
        userLibraryPath: '/custom/lib',
        keyStorePath: '/custom/keys'
      };
      expect(Converters.deviceFileTreeOverrides.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.userLibraryPath).toBe('/custom/lib');
        expect(result.keyStorePath).toBe('/custom/keys');
      });
    });

    test('converts empty object', () => {
      expect(Converters.deviceFileTreeOverrides.convert({})).toSucceed();
    });
  });

  // ============================================================================
  // partialToolSettings converter
  // ============================================================================

  describe('partialToolSettings', () => {
    test('converts full object', () => {
      const input = {
        scaling: { weightUnit: 'kg' },
        workflow: { confirmAbandon: false }
      };
      expect(Converters.partialToolSettings.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.scaling?.weightUnit).toBe('kg');
        expect(result.workflow?.confirmAbandon).toBe(false);
      });
    });

    test('converts empty object', () => {
      expect(Converters.partialToolSettings.convert({})).toSucceed();
    });
  });
});
