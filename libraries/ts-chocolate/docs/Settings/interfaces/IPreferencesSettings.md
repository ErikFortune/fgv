[Home](../../README.md) > [Settings](../README.md) > IPreferencesSettings

# Interface: IPreferencesSettings

Runtime preferences that don't affect what data is loaded.
Stored in: `data/settings/preferences.json` (location specified by bootstrap).

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

[schemaVersion](./IPreferencesSettings.schemaVersion.md)

</td><td>

`readonly`

</td><td>

1

</td><td>

Schema version for migration support

</td></tr>
<tr><td>

[defaultTargets](./IPreferencesSettings.defaultTargets.md)

</td><td>

`readonly`

</td><td>

[IDefaultCollectionTargets](../../interfaces/IDefaultCollectionTargets.md)

</td><td>

Default target collections for each sublibrary

</td></tr>
<tr><td>

[defaultStorageTargets](./IPreferencesSettings.defaultStorageTargets.md)

</td><td>

`readonly`

</td><td>

[IDefaultStorageTargets](../../interfaces/IDefaultStorageTargets.md)

</td><td>

Default storage locations for new collections (global + per-sublibrary)

</td></tr>
<tr><td>

[tools](./IPreferencesSettings.tools.md)

</td><td>

`readonly`

</td><td>

[IToolSettings](../../interfaces/IToolSettings.md)

</td><td>

Tool configuration (scaling, workflow, etc.)

</td></tr>
</tbody></table>
