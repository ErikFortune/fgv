[Home](../README.md) > ISettingsManager

# Interface: ISettingsManager

Interface for managing workspace settings.

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

[deviceId](./ISettingsManager.deviceId.md)

</td><td>

`readonly`

</td><td>

[DeviceId](../type-aliases/DeviceId.md)

</td><td>

The current device identifier.

</td></tr>
<tr><td>

[isDirty](./ISettingsManager.isDirty.md)

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

[getResolvedSettings()](./ISettingsManager.getResolvedSettings.md)

</td><td>



</td><td>

Gets the resolved settings.

</td></tr>
<tr><td>

[getBootstrapSettings()](./ISettingsManager.getBootstrapSettings.md)

</td><td>



</td><td>

Gets the bootstrap settings (preload configuration).

</td></tr>
<tr><td>

[getPreferencesSettings()](./ISettingsManager.getPreferencesSettings.md)

</td><td>



</td><td>

Gets the preferences settings (runtime configuration).

</td></tr>
<tr><td>

[updateBootstrapSettings(updates)](./ISettingsManager.updateBootstrapSettings.md)

</td><td>



</td><td>

Updates bootstrap settings with partial values.

</td></tr>
<tr><td>

[updatePreferencesSettings(updates)](./ISettingsManager.updatePreferencesSettings.md)

</td><td>



</td><td>

Updates preferences settings with partial values.

</td></tr>
<tr><td>

[getCommonSettings()](./ISettingsManager.getCommonSettings.md)

</td><td>



</td><td>

Gets the common settings shared across all devices.

</td></tr>
<tr><td>

[getDeviceSettings()](./ISettingsManager.getDeviceSettings.md)

</td><td>



</td><td>

Gets the device-specific settings.

</td></tr>
<tr><td>

[updateCommonSettings(updates)](./ISettingsManager.updateCommonSettings.md)

</td><td>



</td><td>

Updates common settings with partial values.

</td></tr>
<tr><td>

[updateDeviceSettings(updates)](./ISettingsManager.updateDeviceSettings.md)

</td><td>



</td><td>

Updates device-specific settings with partial values.

</td></tr>
<tr><td>

[updateDefaultTargets(targets)](./ISettingsManager.updateDefaultTargets.md)

</td><td>



</td><td>

Updates the default collection targets (convenience method).

</td></tr>
<tr><td>

[updateDefaultStorageTargets(targets)](./ISettingsManager.updateDefaultStorageTargets.md)

</td><td>



</td><td>

Updates the default storage targets (convenience method).

</td></tr>
<tr><td>

[updateLastActiveSessionId(sessionId)](./ISettingsManager.updateLastActiveSessionId.md)

</td><td>



</td><td>

Updates the last active session ID for this device (convenience method).

</td></tr>
<tr><td>

[save()](./ISettingsManager.save.md)

</td><td>



</td><td>

Saves all pending changes to the file tree.

</td></tr>
</tbody></table>
