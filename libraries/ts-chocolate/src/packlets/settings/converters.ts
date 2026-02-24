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

/**
 * Converters for settings types
 * @packageDocumentation
 */

import { Converter, Converters, Logging, fail, succeed } from '@fgv/ts-utils';

import { Converters as CommonConverters } from '../common';
import { SubLibraryId, allSubLibraryIds } from '../library-data';
import {
  DeviceId,
  ExternalLibraryRef,
  IBootstrapSettings,
  IDefaultCollectionTargets,
  IDefaultStorageTargets,
  IDeviceFileTreeOverrides,
  IExternalLibraryRefConfig,
  ILocalDirectoryRef,
  ILocalStorageConfig,
  ILogSettings,
  IPreferencesSettings,
  IScalingDefaults,
  ISettingsFileLocation,
  IToolSettings,
  IWorkflowPreferences,
  SETTINGS_SCHEMA_VERSION,
  StorageRootId
} from './model';

// ============================================================================
// Validation Patterns
// ============================================================================

/**
 * Pattern for device IDs: alphanumeric, dashes, underscores (no dots).
 * @public
 */
export const DEVICE_ID_PATTERN: RegExp = /^[a-zA-Z0-9_-]+$/;

// ============================================================================
// Branded Type Converters
// ============================================================================

/**
 * Converter for {@link DeviceId}.
 * @public
 */
export const deviceId: Converter<DeviceId> = Converters.string.map((s) => {
  if (!DEVICE_ID_PATTERN.test(s)) {
    return fail(`Invalid device ID "${s}": must match pattern ${DEVICE_ID_PATTERN}`);
  }
  return succeed(s as unknown as DeviceId);
});

/**
 * Converter for {@link ExternalLibraryRef}.
 * External library references are paths or URIs - we accept any non-empty string.
 * @public
 */
export const externalLibraryRef: Converter<ExternalLibraryRef> = Converters.string.map((s) => {
  if (s.length === 0) {
    return fail('External library reference cannot be empty');
  }
  return succeed(s as unknown as ExternalLibraryRef);
});

// ============================================================================
// Tool Configuration Converters
// ============================================================================

/**
 * Converter for {@link IScalingDefaults}.
 * @public
 */
export const scalingDefaults: Converter<IScalingDefaults> = Converters.strictObject<IScalingDefaults>({
  weightUnit: CommonConverters.weightUnit.optional(),
  measurementUnit: CommonConverters.measurementUnit.optional(),
  batchMultiplier: Converters.number.optional(),
  bufferPercentage: CommonConverters.percentage.optional()
});

/**
 * Converter for {@link IWorkflowPreferences}.
 * @public
 */
export const workflowPreferences: Converter<IWorkflowPreferences> =
  Converters.strictObject<IWorkflowPreferences>({
    autoSaveIntervalSeconds: Converters.number.optional(),
    confirmAbandon: Converters.boolean.optional(),
    showPercentages: Converters.boolean.optional(),
    autoExpandIngredients: Converters.boolean.optional(),
    adaptedRecipeNameSuffix: Converters.string.optional()
  });

/**
 * Converter for {@link IToolSettings}.
 * @public
 */
export const toolSettings: Converter<IToolSettings> = Converters.strictObject<IToolSettings>({
  scaling: scalingDefaults.optional(),
  workflow: workflowPreferences.optional()
});

// ============================================================================
// Collection Target Converters
// ============================================================================

/**
 * Converter for {@link IDefaultCollectionTargets}.
 * @public
 */
export const defaultCollectionTargets: Converter<IDefaultCollectionTargets> =
  Converters.strictObject<IDefaultCollectionTargets>({
    journals: CommonConverters.collectionId.optional(),
    sessions: CommonConverters.collectionId.optional(),
    fillings: CommonConverters.collectionId.optional(),
    confections: CommonConverters.collectionId.optional(),
    ingredients: CommonConverters.collectionId.optional(),
    molds: CommonConverters.collectionId.optional(),
    procedures: CommonConverters.collectionId.optional(),
    tasks: CommonConverters.collectionId.optional()
  });

// ============================================================================
// External Library Converters
// ============================================================================

/**
 * Converter for sublibrary load spec as a record (per-sublibrary config).
 * @internal
 */
const subLibraryLoadRecord: Converter<Partial<Record<SubLibraryId | 'default', boolean>>> =
  Converters.generic<Partial<Record<SubLibraryId | 'default', boolean>>>((from: unknown) => {
    if (typeof from !== 'object' || from === null) {
      return fail('Expected object for sublibrary load spec');
    }
    const result: Partial<Record<SubLibraryId | 'default', boolean>> = {};
    const obj = from as Record<string, unknown>;

    for (const key of Object.keys(obj)) {
      if (key !== 'default' && !allSubLibraryIds.includes(key as SubLibraryId)) {
        return fail(`Invalid sublibrary ID: ${key}`);
      }
      const value = obj[key];
      if (typeof value !== 'boolean') {
        return fail(`Expected boolean for sublibrary "${key}", got ${typeof value}`);
      }
      result[key as SubLibraryId | 'default'] = value;
    }
    return succeed(result);
  });

/**
 * Converter for sublibrary load spec (boolean or per-sublibrary config).
 * @internal
 */
const subLibraryLoadSpec: Converter<boolean | Partial<Record<SubLibraryId | 'default', boolean>>> =
  Converters.oneOf<boolean | Partial<Record<SubLibraryId | 'default', boolean>>>([
    Converters.boolean,
    subLibraryLoadRecord
  ]);

/**
 * Converter for {@link IExternalLibraryRefConfig}.
 * @public
 */
export const externalLibraryRefConfig: Converter<IExternalLibraryRefConfig> =
  Converters.strictObject<IExternalLibraryRefConfig>({
    name: Converters.string,
    ref: externalLibraryRef,
    load: subLibraryLoadSpec.optional(),
    mutable: Converters.boolean.optional()
  });

// ============================================================================
// Common Settings Converter
// ============================================================================

/**
 * Converter for settings schema version.
 * @internal
 */
const schemaVersion: Converter<typeof SETTINGS_SCHEMA_VERSION> = Converters.enumeratedValue([
  SETTINGS_SCHEMA_VERSION
]);

/**
 * Converter for {@link StorageRootId}.
 * @public
 */
export const storageRootId: Converter<StorageRootId> = Converters.string.map((s) => {
  if (s.length === 0) {
    return fail('Storage root ID cannot be empty');
  }
  return succeed(s as unknown as StorageRootId);
});

/**
 * Converter for {@link ILocalDirectoryRef}.
 * @public
 */
export const localDirectoryRef: Converter<ILocalDirectoryRef> = Converters.strictObject<ILocalDirectoryRef>({
  label: Converters.string,
  mutable: Converters.boolean,
  load: subLibraryLoadSpec.optional()
});

/**
 * Converter for per-sublibrary storage root overrides.
 * @internal
 */
const sublibraryStorageOverrides: Converter<Partial<Record<SubLibraryId, StorageRootId>>> =
  Converters.generic<Partial<Record<SubLibraryId, StorageRootId>>>((from: unknown) => {
    if (typeof from !== 'object' || from === null) {
      return fail('Expected object for sublibrary storage overrides');
    }
    const result: Partial<Record<SubLibraryId, StorageRootId>> = {};
    const obj = from as Record<string, unknown>;
    for (const key of Object.keys(obj)) {
      if (!allSubLibraryIds.includes(key as SubLibraryId)) {
        return fail(`Invalid sublibrary ID: ${key}`);
      }
      const converted = storageRootId.convert(obj[key]);
      if (converted.isFailure()) {
        return fail(`sublibrary "${key}": ${converted.message}`);
      }
      result[key as SubLibraryId] = converted.value;
    }
    return succeed(result);
  });

/**
 * Raw converter that accepts both legacy `globalDefault` and new `libraryDefault`/`userDataDefault`.
 * @internal
 */
interface IDefaultStorageTargetsRaw {
  globalDefault?: StorageRootId;
  libraryDefault?: StorageRootId;
  userDataDefault?: StorageRootId;
  sublibraryOverrides?: Partial<Record<SubLibraryId, StorageRootId>>;
}

const defaultStorageTargetsRaw: Converter<IDefaultStorageTargetsRaw> =
  Converters.strictObject<IDefaultStorageTargetsRaw>({
    globalDefault: storageRootId.optional(),
    libraryDefault: storageRootId.optional(),
    userDataDefault: storageRootId.optional(),
    sublibraryOverrides: sublibraryStorageOverrides.optional()
  });

/**
 * Converter for {@link IDefaultStorageTargets}.
 * Handles migration from legacy `globalDefault` field to `libraryDefault`.
 * @public
 */
export const defaultStorageTargets: Converter<IDefaultStorageTargets> =
  Converters.generic<IDefaultStorageTargets>((from: unknown) => {
    return defaultStorageTargetsRaw.convert(from).onSuccess((raw) => {
      return succeed({
        libraryDefault: raw.libraryDefault ?? raw.globalDefault,
        userDataDefault: raw.userDataDefault,
        sublibraryOverrides: raw.sublibraryOverrides
      });
    });
  });

// ============================================================================
// Device File Tree Overrides Converter
// ============================================================================

/**
 * Converter for {@link IDeviceFileTreeOverrides}.
 * @public
 */
export const deviceFileTreeOverrides: Converter<IDeviceFileTreeOverrides> =
  Converters.strictObject<IDeviceFileTreeOverrides>({
    userLibraryPath: Converters.string.optional(),
    keyStorePath: Converters.string.optional()
  });

/**
 * Converter for partial tool settings (for device overrides).
 * @public
 */
export const partialToolSettings: Converter<Partial<IToolSettings>> = Converters.strictObject<
  Partial<IToolSettings>
>({
  scaling: scalingDefaults.optional(),
  workflow: workflowPreferences.optional()
});

// ============================================================================
// Settings File Location Converter
// ============================================================================

/**
 * Converter for {@link ISettingsFileLocation}.
 * @public
 */
export const settingsFileLocation: Converter<ISettingsFileLocation> =
  Converters.generic<ISettingsFileLocation>((from: unknown) => {
    if (typeof from !== 'object' || from === null) {
      return fail('Expected object for settings file location');
    }
    const obj = from as Record<string, unknown>;
    if (obj.type === 'local') {
      return succeed({ type: 'local' } as ISettingsFileLocation);
    }
    if (obj.type === 'external') {
      if (typeof obj.rootName !== 'string' || obj.rootName.length === 0) {
        return fail('External settings file location requires a non-empty rootName');
      }
      return succeed({ type: 'external', rootName: obj.rootName } as ISettingsFileLocation);
    }
    return fail(`Invalid settings file location type: ${String(obj.type)}`);
  });

// ============================================================================
// Local Storage Configuration Converter
// ============================================================================

/**
 * Converter for {@link ILocalStorageConfig}.
 * @public
 */
export const localStorageConfig: Converter<ILocalStorageConfig> =
  Converters.strictObject<ILocalStorageConfig>({
    library: Converters.boolean.optional(),
    userData: Converters.boolean.optional()
  });

// ============================================================================
// Logging Settings Converter
// ============================================================================

/**
 * Converter for a single {@link @fgv/ts-utils#Logging.ReporterLogLevel | ReporterLogLevel} value.
 * @public
 */
export const reporterLogLevel: Converter<Logging.ReporterLogLevel> =
  Converters.enumeratedValue<Logging.ReporterLogLevel>([
    'all',
    'detail',
    'info',
    'warning',
    'error',
    'silent'
  ]);

/**
 * Converter for {@link ILogSettings}.
 * @public
 */
export const logSettings: Converter<ILogSettings> = Converters.strictObject<ILogSettings>({
  storeLevel: reporterLogLevel.optional(),
  displayLevel: reporterLogLevel.optional(),
  toastLevel: reporterLogLevel.optional()
});

// ============================================================================
// Bootstrap Settings Converter
// ============================================================================

/**
 * Converter for {@link IBootstrapSettings}.
 * @public
 */
export const bootstrapSettings: Converter<IBootstrapSettings> = Converters.strictObject<IBootstrapSettings>({
  schemaVersion: schemaVersion,
  includeBuiltIn: Converters.boolean.optional(),
  localStorage: localStorageConfig.optional(),
  externalLibraries: Converters.arrayOf(externalLibraryRefConfig).optional(),
  preferencesLocation: settingsFileLocation.optional(),
  keystoreLocation: settingsFileLocation.optional(),
  fileTreeOverrides: deviceFileTreeOverrides.optional(),
  logging: logSettings.optional(),
  deviceName: Converters.string.optional()
});

// ============================================================================
// Preferences Settings Converter
// ============================================================================

/**
 * Converter for {@link IPreferencesSettings}.
 * @public
 */
export const preferencesSettings: Converter<IPreferencesSettings> =
  Converters.strictObject<IPreferencesSettings>({
    schemaVersion: schemaVersion,
    defaultTargets: defaultCollectionTargets.optional(),
    defaultStorageTargets: defaultStorageTargets.optional(),
    tools: toolSettings.optional()
  });
