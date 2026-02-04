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
 * Workspace settings model types.
 *
 * Settings are stored in a directory structure:
 * - `data/settings/common.json` - Shared across all devices
 * - `data/settings/device-{deviceId}.json` - Device-specific overrides
 *
 * @packageDocumentation
 */

import { Brand } from '@fgv/ts-utils';

import { MeasurementUnit, CollectionId, WeightUnit } from '../common';
import { SubLibraryId } from '../library-data';

// ============================================================================
// Schema Version
// ============================================================================

/**
 * Current schema version for settings files.
 * @public
 */
export const SETTINGS_SCHEMA_VERSION: 1 = 1;

/**
 * Schema version discriminator type.
 * @public
 */
export type SettingsSchemaVersion = typeof SETTINGS_SCHEMA_VERSION;

// ============================================================================
// Branded Types
// ============================================================================

/**
 * Unique identifier for a device/platform instance.
 * Pattern: alphanumeric, dashes, underscores (no dots).
 * @public
 */
export type DeviceId = Brand<string, 'DeviceId'>;

/**
 * Reference to an external library (path or URI).
 * Platform layer resolves this to a file tree.
 * @public
 */
export type ExternalLibraryRef = Brand<string, 'ExternalLibraryRef'>;

// ============================================================================
// Tool Configuration - Scaling
// ============================================================================

/**
 * Default scaling configuration for production.
 * @public
 */
export interface IScalingDefaults {
  /** Default weight unit for display (g, oz, lb, kg) */
  readonly weightUnit?: WeightUnit;
  /** Default measurement unit for new ingredients */
  readonly measurementUnit?: MeasurementUnit;
  /** Default batch multiplier (e.g., 1.0 for single batch) */
  readonly batchMultiplier?: number;
  /** Default buffer percentage for molded confections */
  readonly bufferPercentage?: number;
}

// ============================================================================
// Tool Configuration - Workflow
// ============================================================================

/**
 * Production workflow preferences.
 * @public
 */
export interface IWorkflowPreferences {
  /** Auto-save session interval in seconds (0 to disable) */
  readonly autoSaveIntervalSeconds?: number;
  /** Whether to confirm before abandoning unsaved sessions */
  readonly confirmAbandon?: boolean;
  /** Whether to show ingredient percentages by default */
  readonly showPercentages?: boolean;
  /** Whether to auto-expand ingredient details */
  readonly autoExpandIngredients?: boolean;
}

// ============================================================================
// Tool Configuration - Combined
// ============================================================================

/**
 * Tool configuration section of settings.
 * @public
 */
export interface IToolSettings {
  /** Scaling defaults for production */
  readonly scaling?: IScalingDefaults;
  /** Workflow preferences */
  readonly workflow?: IWorkflowPreferences;
}

// ============================================================================
// Default Collection Targets
// ============================================================================

/**
 * Default target collection for each sublibrary type.
 * Used when saving new items (journals, sessions, etc.).
 * @public
 */
export interface IDefaultCollectionTargets {
  /** Default collection for new journals */
  readonly journals?: CollectionId;
  /** Default collection for new sessions */
  readonly sessions?: CollectionId;
  /** Default collection for new fillings */
  readonly fillings?: CollectionId;
  /** Default collection for new confections */
  readonly confections?: CollectionId;
  /** Default collection for new ingredients */
  readonly ingredients?: CollectionId;
  /** Default collection for new molds */
  readonly molds?: CollectionId;
  /** Default collection for new procedures */
  readonly procedures?: CollectionId;
  /** Default collection for new tasks */
  readonly tasks?: CollectionId;
}

// ============================================================================
// External Library References
// ============================================================================

/**
 * Reference to an external library before platform resolution.
 * The ref is platform-specific and will be resolved to a FileTree.
 * @public
 */
export interface IExternalLibraryRefConfig {
  /** Human-readable name for the library */
  readonly name: string;
  /** Platform-specific path or URI (resolved by platform layer) */
  readonly ref: ExternalLibraryRef;
  /**
   * Which sublibraries to load from this source.
   * - true: load all
   * - false: load none
   * - object: per-sublibrary control with optional 'default'
   */
  readonly load?: boolean | Partial<Record<SubLibraryId | 'default', boolean>>;
  /** Whether collections from this source are mutable */
  readonly mutable?: boolean;
}

// ============================================================================
// Common Settings (Shared Across Devices)
// ============================================================================

/**
 * Settings that are shared across all devices.
 * Stored in: data/settings/common.json
 * @public
 */
export interface ICommonSettings {
  /** Schema version for migration support */
  readonly schemaVersion: SettingsSchemaVersion;
  /** Default target collections for each sublibrary */
  readonly defaultTargets?: IDefaultCollectionTargets;
  /** Tool configuration (scaling, workflow, etc.) */
  readonly tools?: IToolSettings;
  /** External library references (paths resolved by platform) */
  readonly externalLibraries?: ReadonlyArray<IExternalLibraryRefConfig>;
}

// ============================================================================
// Device-Specific Settings
// ============================================================================

/**
 * Platform-specific file tree reference overrides.
 * These override paths for a specific device.
 * @public
 */
export interface IDeviceFileTreeOverrides {
  /** Override path for user library root */
  readonly userLibraryPath?: string;
  /** Override path for key store file */
  readonly keyStorePath?: string;
}

/**
 * Settings specific to a device/platform instance.
 * Stored in: `data/settings/device-[deviceId].json`
 * @public
 */
export interface IDeviceSettings {
  /** Schema version for migration support */
  readonly schemaVersion: SettingsSchemaVersion;
  /** Unique device identifier */
  readonly deviceId: DeviceId;
  /** Human-readable device name */
  readonly deviceName?: string;
  /** Last active session ID for this device */
  readonly lastActiveSessionId?: string;
  /** Override default collection targets for this device */
  readonly defaultTargetsOverride?: Partial<IDefaultCollectionTargets>;
  /** Override tool settings for this device */
  readonly toolsOverride?: Partial<IToolSettings>;
  /** Platform-specific file tree path overrides */
  readonly fileTreeOverrides?: IDeviceFileTreeOverrides;
}

// ============================================================================
// Resolved Settings (After Merging Common + Device)
// ============================================================================

/**
 * Fully resolved settings after merging common and device-specific settings.
 * This is what the workspace actually uses at runtime.
 * @public
 */
export interface IResolvedSettings {
  /** The current device ID */
  readonly deviceId: DeviceId;
  /** Merged default targets (device overrides common) */
  readonly defaultTargets: IDefaultCollectionTargets;
  /** Merged tool settings (device overrides common) */
  readonly tools: IToolSettings;
  /** Last active session ID */
  readonly lastActiveSessionId?: string;
}

// ============================================================================
// Default Values
// ============================================================================

/**
 * Default scaling settings.
 * @public
 */
export const DEFAULT_SCALING: IScalingDefaults = {
  weightUnit: 'g',
  measurementUnit: 'g',
  batchMultiplier: 1.0,
  bufferPercentage: 0.1
};

/**
 * Default workflow preferences.
 * @public
 */
export const DEFAULT_WORKFLOW: IWorkflowPreferences = {
  autoSaveIntervalSeconds: 60,
  confirmAbandon: true,
  showPercentages: true,
  autoExpandIngredients: false
};

/**
 * Default tool settings.
 * @public
 */
export const DEFAULT_TOOL_SETTINGS: IToolSettings = {
  scaling: DEFAULT_SCALING,
  workflow: DEFAULT_WORKFLOW
};

// ============================================================================
// Settings Resolution
// ============================================================================

/**
 * Resolves settings by merging common and device-specific settings.
 * Device settings override common settings.
 * @param common - Common settings shared across devices
 * @param device - Device-specific settings
 * @returns Fully resolved settings
 * @public
 */
export function resolveSettings(common: ICommonSettings, device: IDeviceSettings): IResolvedSettings {
  return {
    deviceId: device.deviceId,

    // Merge default targets (device overrides common)
    defaultTargets: {
      ...common.defaultTargets,
      ...device.defaultTargetsOverride
    },

    // Deep merge tool settings
    tools: {
      scaling: {
        ...DEFAULT_SCALING,
        ...common.tools?.scaling,
        ...device.toolsOverride?.scaling
      },
      workflow: {
        ...DEFAULT_WORKFLOW,
        ...common.tools?.workflow,
        ...device.toolsOverride?.workflow
      }
    },

    lastActiveSessionId: device.lastActiveSessionId
  };
}

/**
 * Creates default common settings for first run.
 * @returns Default common settings
 * @public
 */
export function createDefaultCommonSettings(): ICommonSettings {
  return {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    defaultTargets: {},
    tools: DEFAULT_TOOL_SETTINGS,
    externalLibraries: []
  };
}

/**
 * Creates default device settings for first run.
 * @param deviceId - The device identifier
 * @param deviceName - Optional human-readable name
 * @returns Default device settings
 * @public
 */
export function createDefaultDeviceSettings(deviceId: DeviceId, deviceName?: string): IDeviceSettings {
  return {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    deviceId,
    deviceName
  };
}
