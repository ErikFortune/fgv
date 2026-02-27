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
 * Workspace settings packlet.
 *
 * Provides types and utilities for workspace settings management.
 * Settings are stored in a directory structure with:
 * - `bootstrap.json` - Preload configuration (what data sources to set up)
 * - `preferences.json` - Runtime preferences (defaults, tools, etc.)
 *
 * @packageDocumentation
 */

// Model exports
export {
  // Schema version
  SETTINGS_SCHEMA_VERSION,
  type SettingsSchemaVersion,
  // Branded types
  type DeviceId,
  type ExternalLibraryRef,
  // Tool configuration
  type IScalingDefaults,
  type IWorkflowPreferences,
  type IToolSettings,
  // Collection targets
  type IDefaultCollectionTargets,
  // External libraries
  type IExternalLibraryRefConfig,
  // Storage roots and local directories
  type StorageRootId,
  type ILocalDirectoryRef,
  type IDefaultStorageTargets,
  // Bootstrap and preferences
  type ISettingsFileLocation,
  type ILocalStorageConfig,
  type ILogSettings,
  type IBootstrapSettings,
  type IPreferencesSettings,
  createDefaultBootstrapSettings,
  createDefaultPreferencesSettings,
  resolvePreferencesSettings,
  // Device file tree overrides (used by bootstrap)
  type IDeviceFileTreeOverrides,
  type IResolvedSettings,
  // Default values
  DEFAULT_SCALING,
  DEFAULT_WORKFLOW,
  DEFAULT_TOOL_SETTINGS
} from './model';

// Converters (as namespace)
import * as Converters from './converters';
export { Converters };

// Re-export validation pattern
export { DEVICE_ID_PATTERN } from './converters';

// Settings validation exports
export {
  type ISettingsValidationWarning,
  type IMissingRootWarning,
  type IMissingCollectionWarning,
  type IMissingPreferencesLocationWarning,
  type ISettingsValidationContext,
  validateResolvedSettings
} from './settingsValidation';

// Settings manager exports
export {
  type ISettingsManager,
  type ISettingsManagerBootstrapParams,
  SettingsManager,
  SETTINGS_DIR_PATH,
  BOOTSTRAP_SETTINGS_FILENAME,
  PREFERENCES_SETTINGS_FILENAME
} from './settingsManager';
