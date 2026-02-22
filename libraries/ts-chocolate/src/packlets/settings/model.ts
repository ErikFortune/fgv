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

import { Brand, Logging } from '@fgv/ts-utils';

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
  /** Suffix appended to recipe names when creating adapted copies (default: " (adapted)") */
  readonly adaptedRecipeNameSuffix?: string;
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
  /** Default collection for new decorations */
  readonly decorations?: CollectionId;
}

// ============================================================================
// Storage Root Identifiers
// ============================================================================

/**
 * Branded string identifying a storage root.
 * Prefix conventions: 'builtin', 'local:<label>', 'external:<name>'
 * @public
 */
export type StorageRootId = string & { readonly __brand: 'StorageRootId' };

// ============================================================================
// Local Directory References (Device-Specific)
// ============================================================================

/**
 * Reference to a local directory added by the user via the File System Access API.
 * The handle is persisted in IndexedDB; this record is stored in device settings
 * to track which directories should be re-opened on startup.
 * @public
 */
export interface ILocalDirectoryRef {
  /** Display name (matches the FileSystemDirectoryHandle.name) */
  readonly label: string;
  /** Whether the directory was opened with write access */
  readonly mutable: boolean;
  /**
   * Which sublibraries to load from this directory.
   * - true (default): load all
   * - false: load none
   * - object: per-sublibrary control with optional 'default'
   */
  readonly load?: boolean | Partial<Record<SubLibraryId | 'default', boolean>>;
}

// ============================================================================
// Default Storage Targets (Where New Collections Are Created)
// ============================================================================

/**
 * Configures where new collections are created.
 * Distinct from {@link IDefaultCollectionTargets} which targets existing collections for new entities.
 * @public
 */
export interface IDefaultStorageTargets {
  /** Default storage root for new library collections (ingredients, fillings, etc.) */
  readonly libraryDefault?: StorageRootId;
  /** Default storage root for new user data (journals, sessions, inventory) */
  readonly userDataDefault?: StorageRootId;
  /** Per-sublibrary overrides for default storage root */
  readonly sublibraryOverrides?: Partial<Record<SubLibraryId, StorageRootId>>;
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
// Settings File Location
// ============================================================================

/**
 * Specifies where a settings or keystore file lives.
 * @public
 */
export type ISettingsFileLocation =
  | { readonly type: 'local' }
  | { readonly type: 'external'; readonly rootName: string };

// ============================================================================
// Local Storage Configuration
// ============================================================================

/**
 * Controls what is loaded from local (browser) storage.
 * @public
 */
export interface ILocalStorageConfig {
  /** Load library entity collections from local storage. @defaultValue true */
  readonly library?: boolean;
  /** Load user data (journals, sessions, inventory) from local storage. @defaultValue true */
  readonly userData?: boolean;
}

// ============================================================================
// Logging Settings
// ============================================================================

/**
 * Controls the logging verbosity for the application.
 * All three settings use the full {@link @fgv/ts-utils#Logging.ReporterLogLevel | ReporterLogLevel} range.
 * @public
 */
export interface ILogSettings {
  /**
   * Minimum level stored in the message log.
   * Governs what is admitted into the log panel via MessagesLogger.
   * @defaultValue 'info'
   */
  readonly storeLevel?: Logging.ReporterLogLevel;
  /**
   * Initial minimum level shown in the status bar log panel.
   * Can be overridden interactively; this sets the default on load.
   * @defaultValue 'info'
   */
  readonly displayLevel?: Logging.ReporterLogLevel;
  /**
   * Minimum level that triggers a toast popup.
   * @defaultValue 'warning'
   */
  readonly toastLevel?: Logging.ReporterLogLevel;
}

// ============================================================================
// Bootstrap Settings (Preload Configuration)
// ============================================================================

/**
 * Preload configuration that determines what data sources to set up.
 * Stored in: `data/settings/bootstrap.json` (always in fixed local location).
 *
 * Editable from the settings UI; changes require a page reload.
 * @public
 */
export interface IBootstrapSettings {
  /** Schema version for migration support */
  readonly schemaVersion: SettingsSchemaVersion;

  /** Whether to include built-in (embedded) library data. @defaultValue true */
  readonly includeBuiltIn?: boolean;

  /** What to include from local storage. Defaults to all enabled. */
  readonly localStorage?: ILocalStorageConfig;

  /** External roots to load and their configuration */
  readonly externalLibraries?: ReadonlyArray<IExternalLibraryRefConfig>;

  /**
   * Where to find the preferences file.
   * Defaults to local: `data/settings/preferences.json` in local storage.
   */
  readonly preferencesLocation?: ISettingsFileLocation;

  /**
   * Where to find the keystore file.
   * Defaults to local: `keystore.json` in user library root.
   */
  readonly keystoreLocation?: ISettingsFileLocation;

  /**
   * Platform-specific file tree overrides (moved from device settings).
   * Affects where the user library tree root is resolved.
   */
  readonly fileTreeOverrides?: IDeviceFileTreeOverrides;

  /** Logging verbosity settings. */
  readonly logging?: ILogSettings;
}

// ============================================================================
// Preferences Settings (Runtime Configuration)
// ============================================================================

/**
 * Runtime preferences that don't affect what data is loaded.
 * Stored in: `data/settings/preferences.json` (location specified by bootstrap).
 * @public
 */
export interface IPreferencesSettings {
  /** Schema version for migration support */
  readonly schemaVersion: SettingsSchemaVersion;
  /** Default target collections for each sublibrary */
  readonly defaultTargets?: IDefaultCollectionTargets;
  /** Default storage locations for new collections (global + per-sublibrary) */
  readonly defaultStorageTargets?: IDefaultStorageTargets;
  /** Tool configuration (scaling, workflow, etc.) */
  readonly tools?: IToolSettings;
}

// ============================================================================
// Common Settings (Shared Across Devices)
// ============================================================================

/**
 * Settings that are shared across all devices.
 * Stored in: data/settings/common.json
 *
 * @deprecated Use {@link IBootstrapSettings} and {@link IPreferencesSettings} instead.
 * Retained temporarily for migration from common.json.
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
  /** Default storage locations for new collections (global + per-sublibrary) */
  readonly defaultStorageTargets?: IDefaultStorageTargets;
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
 *
 * @deprecated Device settings are vestigial — no UI reads these fields.
 * Directory handles are persisted in IndexedDB, device ID in localStorage.
 * Retained temporarily for migration.
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
  /** Local directories added by the user via File System Access API */
  readonly localDirectories?: ReadonlyArray<ILocalDirectoryRef>;
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
  /** Default storage root targets for new collections (from common settings) */
  readonly defaultStorageTargets?: IDefaultStorageTargets;
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
  autoExpandIngredients: false,
  adaptedRecipeNameSuffix: ' (adapted)'
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
 * Resolves settings from preferences (new two-phase model).
 * @param preferences - Runtime preferences
 * @param deviceId - The current device ID
 * @returns Fully resolved settings
 * @public
 */
export function resolvePreferencesSettings(
  preferences: IPreferencesSettings,
  deviceId: DeviceId
): IResolvedSettings {
  return {
    deviceId,
    defaultTargets: preferences.defaultTargets ?? {},
    tools: {
      scaling: {
        ...DEFAULT_SCALING,
        ...preferences.tools?.scaling
      },
      workflow: {
        ...DEFAULT_WORKFLOW,
        ...preferences.tools?.workflow
      }
    },
    defaultStorageTargets: preferences.defaultStorageTargets
  };
}

/**
 * Resolves settings by merging common and device-specific settings.
 * Device settings override common settings.
 *
 * @deprecated Use {@link resolvePreferencesSettings} instead.
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

    lastActiveSessionId: device.lastActiveSessionId,

    // Default storage targets come from common settings (shared across devices)
    defaultStorageTargets: common.defaultStorageTargets
  };
}

/**
 * Creates default bootstrap settings for first run.
 * @returns Default bootstrap settings
 * @public
 */
export function createDefaultBootstrapSettings(): IBootstrapSettings {
  return {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    includeBuiltIn: true,
    localStorage: { library: true, userData: true },
    externalLibraries: []
  };
}

/**
 * Creates default preferences settings for first run.
 * @returns Default preferences settings
 * @public
 */
export function createDefaultPreferencesSettings(): IPreferencesSettings {
  return {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    defaultTargets: {},
    tools: DEFAULT_TOOL_SETTINGS
  };
}

/**
 * Splits a legacy {@link ICommonSettings} into bootstrap + preferences.
 * Used for one-time migration from common.json.
 * @param common - The legacy common settings
 * @returns Bootstrap and preferences settings
 * @public
 */
export function splitCommonSettings(common: ICommonSettings): {
  bootstrap: IBootstrapSettings;
  preferences: IPreferencesSettings;
} {
  return {
    bootstrap: {
      schemaVersion: SETTINGS_SCHEMA_VERSION,
      includeBuiltIn: true,
      localStorage: { library: true, userData: true },
      externalLibraries: common.externalLibraries
    },
    preferences: {
      schemaVersion: SETTINGS_SCHEMA_VERSION,
      defaultTargets: common.defaultTargets,
      defaultStorageTargets: common.defaultStorageTargets,
      tools: common.tools
    }
  };
}

/**
 * Creates default common settings for first run.
 *
 * @deprecated Use {@link createDefaultBootstrapSettings} and {@link createDefaultPreferencesSettings} instead.
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
 *
 * @deprecated Device settings are vestigial.
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
