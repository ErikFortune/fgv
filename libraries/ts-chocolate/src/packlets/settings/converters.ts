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

import { Converter, Converters, fail, succeed } from '@fgv/ts-utils';

import { Converters as CommonConverters } from '../common';
import { SubLibraryId, allSubLibraryIds } from '../library-data';
import {
  DeviceId,
  ExternalLibraryRef,
  ICommonSettings,
  IDefaultCollectionTargets,
  IDeviceFileTreeOverrides,
  IDeviceSettings,
  IExternalLibraryRefConfig,
  IScalingDefaults,
  IToolSettings,
  IWorkflowPreferences,
  SETTINGS_SCHEMA_VERSION
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
export const scalingDefaults: Converter<IScalingDefaults> = Converters.object<IScalingDefaults>({
  weightUnit: CommonConverters.weightUnit.optional(),
  measurementUnit: CommonConverters.measurementUnit.optional(),
  batchMultiplier: Converters.number.optional(),
  bufferPercentage: CommonConverters.percentage.optional()
});

/**
 * Converter for {@link IWorkflowPreferences}.
 * @public
 */
export const workflowPreferences: Converter<IWorkflowPreferences> = Converters.object<IWorkflowPreferences>({
  autoSaveIntervalSeconds: Converters.number.optional(),
  confirmAbandon: Converters.boolean.optional(),
  showPercentages: Converters.boolean.optional(),
  autoExpandIngredients: Converters.boolean.optional()
});

/**
 * Converter for {@link IToolSettings}.
 * @public
 */
export const toolSettings: Converter<IToolSettings> = Converters.object<IToolSettings>({
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
  Converters.object<IDefaultCollectionTargets>({
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
  Converters.object<IExternalLibraryRefConfig>({
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
 * Converter for {@link ICommonSettings}.
 * @public
 */
export const commonSettings: Converter<ICommonSettings> = Converters.object<ICommonSettings>({
  schemaVersion: schemaVersion,
  defaultTargets: defaultCollectionTargets.optional(),
  tools: toolSettings.optional(),
  externalLibraries: Converters.arrayOf(externalLibraryRefConfig).optional()
});

// ============================================================================
// Device Settings Converter
// ============================================================================

/**
 * Converter for {@link IDeviceFileTreeOverrides}.
 * @public
 */
export const deviceFileTreeOverrides: Converter<IDeviceFileTreeOverrides> =
  Converters.object<IDeviceFileTreeOverrides>({
    userLibraryPath: Converters.string.optional(),
    keyStorePath: Converters.string.optional()
  });

/**
 * Converter for partial tool settings (for device overrides).
 * @public
 */
export const partialToolSettings: Converter<Partial<IToolSettings>> = Converters.object<
  Partial<IToolSettings>
>({
  scaling: scalingDefaults.optional(),
  workflow: workflowPreferences.optional()
});

/**
 * Converter for {@link IDeviceSettings}.
 * @public
 */
export const deviceSettings: Converter<IDeviceSettings> = Converters.object<IDeviceSettings>({
  schemaVersion: schemaVersion,
  deviceId: deviceId,
  deviceName: Converters.string.optional(),
  lastActiveSessionId: Converters.string.optional(),
  defaultTargetsOverride: defaultCollectionTargets.optional(),
  toolsOverride: partialToolSettings.optional(),
  fileTreeOverrides: deviceFileTreeOverrides.optional()
});
