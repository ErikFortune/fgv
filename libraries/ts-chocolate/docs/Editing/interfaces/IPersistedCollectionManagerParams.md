[Home](../../README.md) > [Editing](../README.md) > IPersistedCollectionManagerParams

# Interface: IPersistedCollectionManagerParams

Parameters for creating a PersistedCollectionManager.

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

[subLibrary](./IPersistedCollectionManagerParams.subLibrary.md)

</td><td>

`readonly`

</td><td>

[SubLibraryBase](../../classes/SubLibraryBase.md)&lt;TCompositeId, TBaseId, TItem&gt;

</td><td>

The sub-library containing the collection data.

</td></tr>
<tr><td>

[syncProvider](./IPersistedCollectionManagerParams.syncProvider.md)

</td><td>

`readonly`

</td><td>

[ISyncProvider](../../interfaces/ISyncProvider.md)

</td><td>

Optional sync provider for flushing FileTree changes to disk.

</td></tr>
</tbody></table>
