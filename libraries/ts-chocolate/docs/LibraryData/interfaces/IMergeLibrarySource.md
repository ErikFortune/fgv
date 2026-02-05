[Home](../../README.md) > [LibraryData](../README.md) > IMergeLibrarySource

# Interface: IMergeLibrarySource

Specifies a library to merge with optional collection filtering.

Used when creating a new library that should include collections from
an existing library instance. The filter parameter allows selective
merging of collections.

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

[library](./IMergeLibrarySource.library.md)

</td><td>

`readonly`

</td><td>

TLibrary

</td><td>

The library to merge collections from.

</td></tr>
<tr><td>

[filter](./IMergeLibrarySource.filter.md)

</td><td>

`readonly`

</td><td>

[LibraryLoadSpec](../../type-aliases/LibraryLoadSpec.md)&lt;TCollectionId&gt;

</td><td>

Controls which collections to merge from this library.

</td></tr>
</tbody></table>
