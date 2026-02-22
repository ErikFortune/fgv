[Home](../README.md) > SettingsManager

# Class: SettingsManager

Manages workspace settings - loading, updating, and persisting.

**Implements:** [`ISettingsManager`](../interfaces/ISettingsManager.md)

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[deviceId](./SettingsManager.deviceId.md)

</td><td>

`readonly`

</td><td>

[DeviceId](../type-aliases/DeviceId.md)

</td><td>

The current device identifier.

</td></tr>
<tr><td>

[isDirty](./SettingsManager.isDirty.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether there are unsaved changes.

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[createFromBootstrap(params)](./SettingsManager.createFromBootstrap.md)

</td><td>

`static`

</td><td>

Creates a new SettingsManager from bootstrap + preferences files.

</td></tr>
<tr><td>

[createFromBootstrapWithMigration(params)](./SettingsManager.createFromBootstrapWithMigration.md)

</td><td>

`static`

</td><td>

Creates a new SettingsManager from bootstrap + preferences files,
auto-migrating from common.json if bootstrap.json doesn't exist yet.

</td></tr>
<tr><td>

[create(params)](./SettingsManager.create.md)

</td><td>

`static`

</td><td>

Creates a new SettingsManager, loading settings from the file tree.

</td></tr>
<tr><td>

[getResolvedSettings()](./SettingsManager.getResolvedSettings.md)

</td><td>



</td><td>

Gets the resolved settings.

</td></tr>
<tr><td>

[getBootstrapSettings()](./SettingsManager.getBootstrapSettings.md)

</td><td>



</td><td>

Gets the bootstrap settings (preload configuration).

</td></tr>
<tr><td>

[getPreferencesSettings()](./SettingsManager.getPreferencesSettings.md)

</td><td>



</td><td>

Gets the preferences settings (runtime configuration).

</td></tr>
<tr><td>

[updateBootstrapSettings(updates)](./SettingsManager.updateBootstrapSettings.md)

</td><td>



</td><td>

Updates bootstrap settings with partial values.

</td></tr>
<tr><td>

[updatePreferencesSettings(updates)](./SettingsManager.updatePreferencesSettings.md)

</td><td>



</td><td>

Updates preferences settings with partial values.

</td></tr>
<tr><td>

[getCommonSettings()](./SettingsManager.getCommonSettings.md)

</td><td>



</td><td>

Gets the common settings shared across all devices.

</td></tr>
<tr><td>

[getDeviceSettings()](./SettingsManager.getDeviceSettings.md)

</td><td>



</td><td>

Gets the device-specific settings.

</td></tr>
<tr><td>

[updateCommonSettings(updates)](./SettingsManager.updateCommonSettings.md)

</td><td>



</td><td>

Updates common settings with partial values.

</td></tr>
<tr><td>

[updateDeviceSettings(updates)](./SettingsManager.updateDeviceSettings.md)

</td><td>



</td><td>

Updates device-specific settings with partial values.

</td></tr>
<tr><td>

[updateDefaultTargets(targets)](./SettingsManager.updateDefaultTargets.md)

</td><td>



</td><td>

Updates the default collection targets (convenience method).

</td></tr>
<tr><td>

[updateDefaultStorageTargets(targets)](./SettingsManager.updateDefaultStorageTargets.md)

</td><td>



</td><td>

Updates the default storage targets (convenience method).

</td></tr>
<tr><td>

[updateLastActiveSessionId(sessionId)](./SettingsManager.updateLastActiveSessionId.md)

</td><td>



</td><td>

Updates the last active session ID for this device (convenience method).

</td></tr>
<tr><td>

[save()](./SettingsManager.save.md)

</td><td>



</td><td>

Saves all pending changes to the file tree.

</td></tr>
<tr><td>

[updateToolSettings(tools)](./SettingsManager.updateToolSettings.md)

</td><td>



</td><td>

Updates tool settings.

</td></tr>
<tr><td>

[updateDeviceToolsOverride(tools)](./SettingsManager.updateDeviceToolsOverride.md)

</td><td>



</td><td>

Updates device tool settings overrides.

</td></tr>
</tbody></table>
