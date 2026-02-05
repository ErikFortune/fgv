[Home](../../README.md) > [LibraryData](../README.md) > ICollectionLoadResult

# Interface: ICollectionLoadResult

Result of loading collections from a file tree.

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

[collections](./ICollectionLoadResult.collections.md)

</td><td>

`readonly`

</td><td>

readonly [IRuntimeCollection](../../interfaces/IRuntimeCollection.md)&lt;T, TCollectionId, TItemId&gt;[]

</td><td>

Successfully loaded collections with runtime FileTree references.

</td></tr>
<tr><td>

[protectedCollections](./ICollectionLoadResult.protectedCollections.md)

</td><td>

`readonly`

</td><td>

readonly IProtectedCollectionInternal&lt;TCollectionId&gt;[]

</td><td>

Protected collections that were captured but not decrypted.

</td></tr>
</tbody></table>
