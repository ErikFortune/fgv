[Home](../../README.md) > [Settings](../README.md) > IResolvedSettings

# Interface: IResolvedSettings

Fully resolved settings after merging common and device-specific settings.
This is what the workspace actually uses at runtime.

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

[deviceId](./IResolvedSettings.deviceId.md)

</td><td>

`readonly`

</td><td>

[DeviceId](../../type-aliases/DeviceId.md)

</td><td>

The current device ID

</td></tr>
<tr><td>

[defaultTargets](./IResolvedSettings.defaultTargets.md)

</td><td>

`readonly`

</td><td>

[IDefaultCollectionTargets](../../interfaces/IDefaultCollectionTargets.md)

</td><td>

Merged default targets (device overrides common)

</td></tr>
<tr><td>

[tools](./IResolvedSettings.tools.md)

</td><td>

`readonly`

</td><td>

[IToolSettings](../../interfaces/IToolSettings.md)

</td><td>

Merged tool settings (device overrides common)

</td></tr>
<tr><td>

[lastActiveSessionId](./IResolvedSettings.lastActiveSessionId.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Last active session ID

</td></tr>
<tr><td>

[defaultStorageTargets](./IResolvedSettings.defaultStorageTargets.md)

</td><td>

`readonly`

</td><td>

[IDefaultStorageTargets](../../interfaces/IDefaultStorageTargets.md)

</td><td>

Default storage root targets for new collections (from common settings)

</td></tr>
</tbody></table>
