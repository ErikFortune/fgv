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
 * - `data/settings/bootstrap.json` - Preload configuration (what data sources to set up)
 * - `data/settings/preferences.json` - Runtime preferences (defaults, tools, etc.)
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
// Tool Configuration - AI Assist
// ============================================================================

/**
 * Identifier for an AI assist provider.
 * @public
 */
export type AiAssistProvider =
  | 'copy-paste'
  | 'xai-grok'
  | 'openai'
  | 'anthropic'
  | 'google-gemini'
  | 'groq'
  | 'mistral';

/**
 * All valid AI assist provider values.
 * @public
 */
export const allAiAssistProviders: ReadonlyArray<AiAssistProvider> = [
  'copy-paste',
  'xai-grok',
  'openai',
  'anthropic',
  'google-gemini',
  'groq',
  'mistral'
];

/**
 * Configuration for a single AI assist provider.
 * @public
 */
export interface IAiAssistProviderConfig {
  /** Which provider this configures */
  readonly provider: AiAssistProvider;
  /** For API-based providers: the keystore secret name holding the API key */
  readonly secretName?: string;
  /** Optional model override (provider has a default) */
  readonly model?: string;
}

/**
 * AI assist settings — which providers are enabled and their configuration.
 * @public
 */
export interface IAiAssistSettings {
  /** Enabled providers and their configuration. */
  readonly providers: ReadonlyArray<IAiAssistProviderConfig>;
  /** Which enabled provider is the default for the main button. Falls back to first in list. */
  readonly defaultProvider?: AiAssistProvider;
}

/**
 * Default AI assist settings (copy-paste only).
 * @public
 */
export const DEFAULT_AI_ASSIST: IAiAssistSettings = {
  providers: [{ provider: 'copy-paste' }]
};

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
  /** AI assist preferences */
  readonly aiAssist?: IAiAssistSettings;
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

  /** Human-readable name for this device/platform instance. */
  readonly deviceName?: string;
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
// Device-Specific File Tree Overrides
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

// ============================================================================
// Resolved Settings (After Merging Preferences)
// ============================================================================

/**
 * Fully resolved settings after merging preferences.
 * This is what the workspace actually uses at runtime.
 * @public
 */
export interface IResolvedSettings {
  /** The current device ID */
  readonly deviceId: DeviceId;
  /** Merged default targets */
  readonly defaultTargets: IDefaultCollectionTargets;
  /** Merged tool settings */
  readonly tools: IToolSettings;
  /** Default storage root targets for new collections */
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
      },
      aiAssist: preferences.tools?.aiAssist ?? DEFAULT_AI_ASSIST
    },
    defaultStorageTargets: preferences.defaultStorageTargets
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
