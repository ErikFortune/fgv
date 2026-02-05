[Home](../../README.md) > [LibraryData](../README.md) > IResolvedSubLibrarySource

# Interface: IResolvedSubLibrarySource

Result of resolving a file tree source for a specific sub-library.

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

[subLibraryId](./IResolvedSubLibrarySource.subLibraryId.md)

</td><td>

`readonly`

</td><td>

[SubLibraryId](../../type-aliases/SubLibraryId.md)

</td><td>

The sub-library identifier

</td></tr>
<tr><td>

[directory](./IResolvedSubLibrarySource.directory.md)

</td><td>

`readonly`

</td><td>

IFileTreeDirectoryItem

</td><td>

The directory containing collections for this sub-library

</td></tr>
<tr><td>

[loadParams](./IResolvedSubLibrarySource.loadParams.md)

</td><td>

`readonly`

</td><td>

[ILoadCollectionFromFileTreeParams](../../interfaces/ILoadCollectionFromFileTreeParams.md)&lt;string&gt;

</td><td>

Load parameters for the collection loader

</td></tr>
</tbody></table>
