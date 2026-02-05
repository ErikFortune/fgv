[Home](../../README.md) > [LibraryData](../README.md) > ICollectionSourceFile

# Interface: ICollectionSourceFile

Structure of collection source files (YAML/JSON).

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

[metadata](./ICollectionSourceFile.metadata.md)

</td><td>

`readonly`

</td><td>

[ICollectionSourceMetadata](../../interfaces/ICollectionSourceMetadata.md)

</td><td>

Optional metadata about the collection.

</td></tr>
<tr><td>

[items](./ICollectionSourceFile.items.md)

</td><td>

`readonly`

</td><td>

Record&lt;string, T&gt;

</td><td>

The actual collection items, keyed by item ID.

</td></tr>
</tbody></table>
