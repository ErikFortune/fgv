[Home](../README.md) > ISubLibraryParams

# Interface: ISubLibraryParams

Parameters for creating a sub-library instance.

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

[builtin](./ISubLibraryParams.builtin.md)

</td><td>

`readonly`

</td><td>

[LibraryLoadSpec](../type-aliases/LibraryLoadSpec.md)&lt;[CollectionId](../type-aliases/CollectionId.md)&gt;

</td><td>

Controls which built-in collections are loaded.

</td></tr>
<tr><td>

[fileSources](./ISubLibraryParams.fileSources.md)

</td><td>

`readonly`

</td><td>

[SubLibraryFileTreeSource](../type-aliases/SubLibraryFileTreeSource.md) | readonly [SubLibraryFileTreeSource](../type-aliases/SubLibraryFileTreeSource.md)[]

</td><td>

File tree sources to load collections from.

</td></tr>
<tr><td>

[collections](./ISubLibraryParams.collections.md)

</td><td>

`readonly`

</td><td>

readonly TEntryInit[]

</td><td>

Optional additional collections.

</td></tr>
<tr><td>

[mergeLibraries](./ISubLibraryParams.mergeLibraries.md)

</td><td>

`readonly`

</td><td>

[SubLibraryMergeSource](../type-aliases/SubLibraryMergeSource.md)&lt;TLibrary&gt; | readonly [SubLibraryMergeSource](../type-aliases/SubLibraryMergeSource.md)&lt;TLibrary&gt;[]

</td><td>

Existing libraries to merge collections from.

</td></tr>
<tr><td>

[logger](./ISubLibraryParams.logger.md)

</td><td>

`readonly`

</td><td>

LogReporter&lt;unknown, unknown&gt;

</td><td>

Optional logger for reporting loading progress and issues.

</td></tr>
<tr><td>

[protectedCollections](./ISubLibraryParams.protectedCollections.md)

</td><td>

`readonly`

</td><td>

readonly IProtectedCollectionInternal&lt;[CollectionId](../type-aliases/CollectionId.md)&gt;[]

</td><td>

Protected collections that were captured during loading.

</td></tr>
</tbody></table>
