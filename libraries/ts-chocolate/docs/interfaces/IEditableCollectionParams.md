[Home](../README.md) > IEditableCollectionParams

# Interface: IEditableCollectionParams

Parameters for creating an editable collection.

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

[collectionId](./IEditableCollectionParams.collectionId.md)

</td><td>

`readonly`

</td><td>

[CollectionId](../type-aliases/CollectionId.md)

</td><td>

Collection identifier.

</td></tr>
<tr><td>

[metadata](./IEditableCollectionParams.metadata.md)

</td><td>

`readonly`

</td><td>

[ICollectionSourceMetadata](ICollectionSourceMetadata.md)

</td><td>

Collection metadata (name, description, etc.).

</td></tr>
<tr><td>

[isMutable](./IEditableCollectionParams.isMutable.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether this collection is mutable.

</td></tr>
<tr><td>

[initialItems](./IEditableCollectionParams.initialItems.md)

</td><td>

`readonly`

</td><td>

ReadonlyMap&lt;TBaseId, T&gt;

</td><td>

Initial items in the collection.

</td></tr>
<tr><td>

[keyConverter](./IEditableCollectionParams.keyConverter.md)

</td><td>

`readonly`

</td><td>

Converter&lt;TBaseId, unknown&gt;

</td><td>

Converter for validating base ID keys.

</td></tr>
<tr><td>

[valueConverter](./IEditableCollectionParams.valueConverter.md)

</td><td>

`readonly`

</td><td>

Converter&lt;T, unknown&gt;

</td><td>

Converter for validating values.

</td></tr>
<tr><td>

[sourceItem](./IEditableCollectionParams.sourceItem.md)

</td><td>

`readonly`

</td><td>

FileTreeItem

</td><td>

Optional reference to the source FileTree item for persistence.

</td></tr>
</tbody></table>
