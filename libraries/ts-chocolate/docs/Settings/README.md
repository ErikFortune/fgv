[Home](../README.md) > Settings

# Namespace: Settings

Workspace settings packlet.

Provides types and utilities for workspace settings management.
Settings are stored in a directory structure with:
- `bootstrap.json` - Preload configuration (what data sources to set up)
- `preferences.json` - Runtime preferences (defaults, tools, etc.)

## Namespaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[Converters](./Converters/README.md)

</td><td>

Converters for settings types

</td></tr>
</tbody></table>

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[SettingsManager](./classes/SettingsManager.md)

</td><td>

Manages workspace settings - loading, updating, and persisting.

</td></tr>
</tbody></table>

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[IScalingDefaults](./interfaces/IScalingDefaults.md)

</td><td>

Default scaling configuration for production.

</td></tr>
<tr><td>

[IWorkflowPreferences](./interfaces/IWorkflowPreferences.md)

</td><td>

Production workflow preferences.

</td></tr>
<tr><td>

[IToolSettings](./interfaces/IToolSettings.md)

</td><td>

Tool configuration section of settings.

</td></tr>
<tr><td>

[IDefaultCollectionTargets](./interfaces/IDefaultCollectionTargets.md)

</td><td>

Default target collection for each sublibrary type.

</td></tr>
<tr><td>

[IExternalLibraryRefConfig](./interfaces/IExternalLibraryRefConfig.md)

</td><td>

Reference to an external library before platform resolution.

</td></tr>
<tr><td>

[ILocalDirectoryRef](./interfaces/ILocalDirectoryRef.md)

</td><td>

Reference to a local directory added by the user via the File System Access API.

</td></tr>
<tr><td>

[IDefaultStorageTargets](./interfaces/IDefaultStorageTargets.md)

</td><td>

Configures where new collections are created.

</td></tr>
<tr><td>

[ILocalStorageConfig](./interfaces/ILocalStorageConfig.md)

</td><td>

Controls what is loaded from local (browser) storage.

</td></tr>
<tr><td>

[ICloudStorageConfig](./interfaces/ICloudStorageConfig.md)

</td><td>

Controls how cloud-backed HTTP storage is loaded.

</td></tr>
<tr><td>

[ILogSettings](./interfaces/ILogSettings.md)

</td><td>

Controls the logging verbosity for the application.

</td></tr>
<tr><td>

[IBootstrapSettings](./interfaces/IBootstrapSettings.md)

</td><td>

Preload configuration that determines what data sources to set up.

</td></tr>
<tr><td>

[IPreferencesSettings](./interfaces/IPreferencesSettings.md)

</td><td>

Runtime preferences that don't affect what data is loaded.

</td></tr>
<tr><td>

[IDeviceFileTreeOverrides](./interfaces/IDeviceFileTreeOverrides.md)

</td><td>

Platform-specific file tree reference overrides.

</td></tr>
<tr><td>

[IResolvedSettings](./interfaces/IResolvedSettings.md)

</td><td>

Fully resolved settings after merging preferences.

</td></tr>
<tr><td>

[ISettingsManager](./interfaces/ISettingsManager.md)

</td><td>

Interface for managing workspace settings.

</td></tr>
<tr><td>

[ISettingsManagerBootstrapParams](./interfaces/ISettingsManagerBootstrapParams.md)

</td><td>

Parameters for creating a SettingsManager.

</td></tr>
</tbody></table>

## Type Aliases

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[SettingsSchemaVersion](./type-aliases/SettingsSchemaVersion.md)

</td><td>

Schema version discriminator type.

</td></tr>
<tr><td>

[DeviceId](./type-aliases/DeviceId.md)

</td><td>

Unique identifier for a device/platform instance.

</td></tr>
<tr><td>

[ExternalLibraryRef](./type-aliases/ExternalLibraryRef.md)

</td><td>

Reference to an external library (path or URI).

</td></tr>
<tr><td>

[StorageRootId](./type-aliases/StorageRootId.md)

</td><td>

Branded string identifying a storage root.

</td></tr>
<tr><td>

[ISettingsFileLocation](./type-aliases/ISettingsFileLocation.md)

</td><td>

Specifies where a settings or keystore file lives.

</td></tr>
</tbody></table>

## Functions

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[createDefaultBootstrapSettings](./functions/createDefaultBootstrapSettings.md)

</td><td>

Creates default bootstrap settings for first run.

</td></tr>
<tr><td>

[createDefaultPreferencesSettings](./functions/createDefaultPreferencesSettings.md)

</td><td>

Creates default preferences settings for first run.

</td></tr>
<tr><td>

[resolvePreferencesSettings](./functions/resolvePreferencesSettings.md)

</td><td>

Resolves settings from preferences (new two-phase model).

</td></tr>
</tbody></table>

## Variables

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[SETTINGS_SCHEMA_VERSION](./variables/SETTINGS_SCHEMA_VERSION.md)

</td><td>

Current schema version for settings files.

</td></tr>
<tr><td>

[DEFAULT_SCALING](./variables/DEFAULT_SCALING.md)

</td><td>

Default scaling settings.

</td></tr>
<tr><td>

[DEFAULT_WORKFLOW](./variables/DEFAULT_WORKFLOW.md)

</td><td>

Default workflow preferences.

</td></tr>
<tr><td>

[DEFAULT_TOOL_SETTINGS](./variables/DEFAULT_TOOL_SETTINGS.md)

</td><td>

Default tool settings.

</td></tr>
<tr><td>

[SETTINGS_DIR_PATH](./variables/SETTINGS_DIR_PATH.md)

</td><td>

Path to the settings directory within the user library.

</td></tr>
<tr><td>

[BOOTSTRAP_SETTINGS_FILENAME](./variables/BOOTSTRAP_SETTINGS_FILENAME.md)

</td><td>

Filename for bootstrap settings.

</td></tr>
<tr><td>

[PREFERENCES_SETTINGS_FILENAME](./variables/PREFERENCES_SETTINGS_FILENAME.md)

</td><td>

Filename for preferences settings.

</td></tr>
</tbody></table>
