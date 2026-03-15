[Home](../../README.md) > [LibraryData](../README.md) > ICollection

# Interface: ICollection

Representation of a collection of items as serialized data.
This is the base data interface without runtime-only properties.

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

[ICollectionRuntimeMetadata](../../interfaces/ICollectionRuntimeMetadata.md)

</td><td>

Optional metadata from the source file.

</td></tr>
</tbody></table>
