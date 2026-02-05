[Home](../README.md) > IRuntimeCollection

# Interface: IRuntimeCollection

Runtime representation of a collection loaded from a FileTree.
Extends the base collection data with a reference to the source FileTree item.

**Extends:** [`ICollection<T, TCOLLECTIONID, TITEMID>`](ICollection.md)

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

[sourceItem](./IRuntimeCollection.sourceItem.md)

</td><td>

`readonly`

</td><td>

FileTreeItem

</td><td>

Reference to the source FileTree item for persistence.

</td></tr>
<tr><td>

[id](./ICollection.id.md)

</td><td>

`readonly`

</td><td>

TCOLLECTIONID

</td><td>



</td></tr>
<tr><td>

[isMutable](./ICollection.isMutable.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether this collection is mutable (can be edited in the application).

</td></tr>
<tr><td>

[items](./ICollection.items.md)

</td><td>

`readonly`

</td><td>

Record&lt;TITEMID, T&gt;

</td><td>



</td></tr>
<tr><td>

[metadata](./ICollection.metadata.md)

</td><td>

`readonly`

</td><td>

[ICollectionSourceMetadata](ICollectionSourceMetadata.md)

</td><td>

Optional metadata from the source file.

</td></tr>
</tbody></table>
