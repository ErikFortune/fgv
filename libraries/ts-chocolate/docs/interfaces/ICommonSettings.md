[Home](../README.md) > ICommonSettings

# Interface: ICommonSettings

Settings that are shared across all devices.
Stored in: data/settings/common.json

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

[schemaVersion](./ICommonSettings.schemaVersion.md)

</td><td>

`readonly`

</td><td>

1

</td><td>

Schema version for migration support

</td></tr>
<tr><td>

[defaultTargets](./ICommonSettings.defaultTargets.md)

</td><td>

`readonly`

</td><td>

[IDefaultCollectionTargets](IDefaultCollectionTargets.md)

</td><td>

Default target collections for each sublibrary

</td></tr>
<tr><td>

[tools](./ICommonSettings.tools.md)

</td><td>

`readonly`

</td><td>

[IToolSettings](IToolSettings.md)

</td><td>

Tool configuration (scaling, workflow, etc.)

</td></tr>
<tr><td>

[externalLibraries](./ICommonSettings.externalLibraries.md)

</td><td>

`readonly`

</td><td>

readonly [IExternalLibraryRefConfig](IExternalLibraryRefConfig.md)[]

</td><td>

External library references (paths resolved by platform)

</td></tr>
</tbody></table>
