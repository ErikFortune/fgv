[Home](../README.md) > IDeviceSettings

# Interface: IDeviceSettings

Settings specific to a device/platform instance.
Stored in: `data/settings/device-[deviceId].json`

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

[schemaVersion](./IDeviceSettings.schemaVersion.md)

</td><td>

`readonly`

</td><td>

1

</td><td>

Schema version for migration support

</td></tr>
<tr><td>

[deviceId](./IDeviceSettings.deviceId.md)

</td><td>

`readonly`

</td><td>

[DeviceId](../type-aliases/DeviceId.md)

</td><td>

Unique device identifier

</td></tr>
<tr><td>

[deviceName](./IDeviceSettings.deviceName.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Human-readable device name

</td></tr>
<tr><td>

[lastActiveSessionId](./IDeviceSettings.lastActiveSessionId.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Last active session ID for this device

</td></tr>
<tr><td>

[defaultTargetsOverride](./IDeviceSettings.defaultTargetsOverride.md)

</td><td>

`readonly`

</td><td>

Partial&lt;[IDefaultCollectionTargets](IDefaultCollectionTargets.md)&gt;

</td><td>

Override default collection targets for this device

</td></tr>
<tr><td>

[toolsOverride](./IDeviceSettings.toolsOverride.md)

</td><td>

`readonly`

</td><td>

Partial&lt;[IToolSettings](IToolSettings.md)&gt;

</td><td>

Override tool settings for this device

</td></tr>
<tr><td>

[fileTreeOverrides](./IDeviceSettings.fileTreeOverrides.md)

</td><td>

`readonly`

</td><td>

[IDeviceFileTreeOverrides](IDeviceFileTreeOverrides.md)

</td><td>

Platform-specific file tree path overrides

</td></tr>
<tr><td>

[localDirectories](./IDeviceSettings.localDirectories.md)

</td><td>

`readonly`

</td><td>

readonly [ILocalDirectoryRef](ILocalDirectoryRef.md)[]

</td><td>

Local directories added by the user via File System Access API

</td></tr>
</tbody></table>
