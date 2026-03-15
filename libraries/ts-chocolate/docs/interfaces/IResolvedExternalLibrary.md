[Home](../README.md) > IResolvedExternalLibrary

# Interface: IResolvedExternalLibrary

An external library reference after platform resolution.
The ref has been resolved to a FileTree that can be used directly.

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

[name](./IResolvedExternalLibrary.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Human-readable name for the library.

</td></tr>
<tr><td>

[originalRef](./IResolvedExternalLibrary.originalRef.md)

</td><td>

`readonly`

</td><td>

[ExternalLibraryRef](../type-aliases/ExternalLibraryRef.md)

</td><td>

The original reference that was resolved.

</td></tr>
<tr><td>

[fileTree](./IResolvedExternalLibrary.fileTree.md)

</td><td>

`readonly`

</td><td>

IFileTreeDirectoryItem

</td><td>

The resolved file tree root directory.

</td></tr>
<tr><td>

[load](./IResolvedExternalLibrary.load.md)

</td><td>

`readonly`

</td><td>

boolean | Partial&lt;Record&lt;"default" | [SubLibraryId](../type-aliases/SubLibraryId.md), boolean&gt;&gt;

</td><td>

Which sublibraries to load from this source.

</td></tr>
<tr><td>

[mutable](./IResolvedExternalLibrary.mutable.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether collections from this source are mutable.

</td></tr>
<tr><td>

[persistentTree](./IResolvedExternalLibrary.persistentTree.md)

</td><td>

`readonly`

</td><td>

{ tree: FileTree_2; accessors: IPersistentFileTreeAccessors }

</td><td>

Optional persistent tree details for sources that support syncToDisk.

</td></tr>
<tr><td>

[skipMissingDirectories](./IResolvedExternalLibrary.skipMissingDirectories.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

If true, missing sub-library directories are treated as empty for this source.

</td></tr>
</tbody></table>
