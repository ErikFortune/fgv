[Home](../../README.md) > [LibraryData](../README.md) > IFileTreeSource

# Interface: IFileTreeSource

Specifies a file tree source for a single sub-library (ingredients or recipes).

This is the common base type for sub-library-specific file tree sources.
Each sub-library navigates to its standard path within the tree and
loads collections according to the load spec.

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

[directory](./IFileTreeSource.directory.md)

</td><td>

`readonly`

</td><td>

IFileTreeDirectoryItem

</td><td>

Root directory of the library tree.

</td></tr>
<tr><td>

[load](./IFileTreeSource.load.md)

</td><td>

`readonly`

</td><td>

[LibraryLoadSpec](../../type-aliases/LibraryLoadSpec.md)&lt;TCollectionId&gt;

</td><td>

Controls which collections to load from this source.

</td></tr>
<tr><td>

[mutable](./IFileTreeSource.mutable.md)

</td><td>

`readonly`

</td><td>

[MutabilitySpec](../../type-aliases/MutabilitySpec.md)

</td><td>

Mutability specification for collections from this source.

</td></tr>
<tr><td>

[skipMissingDirectories](./IFileTreeSource.skipMissingDirectories.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

If true, gracefully skip this source when its data directory does not exist
instead of failing.

</td></tr>
</tbody></table>
