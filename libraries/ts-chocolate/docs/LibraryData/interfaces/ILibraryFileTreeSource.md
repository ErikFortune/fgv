[Home](../../README.md) > [LibraryData](../README.md) > ILibraryFileTreeSource

# Interface: ILibraryFileTreeSource

Specifies a file tree source for the full library (all sub-libraries).

Navigates to standard paths (data/ingredients, data/recipes) within the tree
and loads collections according to the specified load spec.

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

[directory](./ILibraryFileTreeSource.directory.md)

</td><td>

`readonly`

</td><td>

IFileTreeDirectoryItem

</td><td>

Root directory of the library tree.

</td></tr>
<tr><td>

[load](./ILibraryFileTreeSource.load.md)

</td><td>

`readonly`

</td><td>

[FullLibraryLoadSpec](../../type-aliases/FullLibraryLoadSpec.md)

</td><td>

Which sub-libraries to load from this source.

</td></tr>
<tr><td>

[mutable](./ILibraryFileTreeSource.mutable.md)

</td><td>

`readonly`

</td><td>

[MutabilitySpec](../../type-aliases/MutabilitySpec.md)

</td><td>

Mutability specification for collections from this source.

</td></tr>
<tr><td>

[skipMissingDirectories](./ILibraryFileTreeSource.skipMissingDirectories.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

If true, gracefully skip this source when its data directory does not exist
instead of failing.

</td></tr>
</tbody></table>
