[Home](../../README.md) > [LibraryData](../README.md) > ISubLibraryAsyncLoadResult

# Interface: ISubLibraryAsyncLoadResult

Result from async collection loading operations.

Contains both successfully loaded collections and protected collections
that were captured but could not be decrypted (e.g., due to missing keys).

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

[collections](./ISubLibraryAsyncLoadResult.collections.md)

</td><td>

`readonly`

</td><td>

readonly [SubLibraryEntryInit](../../type-aliases/SubLibraryEntryInit.md)&lt;TBaseId, TItem&gt;[]

</td><td>

Successfully loaded collections ready to be added to the library.

</td></tr>
<tr><td>

[protectedCollections](./ISubLibraryAsyncLoadResult.protectedCollections.md)

</td><td>

`readonly`

</td><td>

readonly IProtectedCollectionInternal&lt;[CollectionId](../../type-aliases/CollectionId.md)&gt;[]

</td><td>

Protected collections that were captured but not decrypted.

</td></tr>
</tbody></table>
