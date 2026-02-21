[Home](../README.md) > IDefaultStorageTargets

# Interface: IDefaultStorageTargets

Configures where new collections are created.
Distinct from IDefaultCollectionTargets which targets existing collections for new entities.

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

[globalDefault](./IDefaultStorageTargets.globalDefault.md)

</td><td>

`readonly`

</td><td>

[StorageRootId](../type-aliases/StorageRootId.md)

</td><td>

Global default storage root for new collections

</td></tr>
<tr><td>

[sublibraryOverrides](./IDefaultStorageTargets.sublibraryOverrides.md)

</td><td>

`readonly`

</td><td>

Partial&lt;Record&lt;[SubLibraryId](../type-aliases/SubLibraryId.md), [StorageRootId](../type-aliases/StorageRootId.md)&gt;&gt;

</td><td>

Per-sublibrary overrides for default storage root

</td></tr>
</tbody></table>
