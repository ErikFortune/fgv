[Home](../README.md) > IChocolateEntityLibraryCreateParams

# Interface: IChocolateEntityLibraryCreateParams

Parameters for creating a LibraryRuntime.ChocolateEntityLibrary | ChocolateEntityLibrary.

Sources are processed in order:
1. Built-in collections (if enabled)
2. File tree sources (in array order)
3. Pre-instantiated libraries (merged in)

When multiple sources provide the same collection ID within a sub-library,
an error is returned (strict mode - no overwrites).

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

[builtin](./IChocolateEntityLibraryCreateParams.builtin.md)

</td><td>

`readonly`

</td><td>

[FullLibraryLoadSpec](../type-aliases/FullLibraryLoadSpec.md)

</td><td>

LibraryData.FullLibraryLoadSpec | Specifies built-in data loading for each sub-library.

</td></tr>
<tr><td>

[fileSources](./IChocolateEntityLibraryCreateParams.fileSources.md)

</td><td>

`readonly`

</td><td>

[ILibraryFileTreeSource](ILibraryFileTreeSource.md) | readonly [ILibraryFileTreeSource](ILibraryFileTreeSource.md)[]

</td><td>

LibraryData.ILibraryFileTreeSource | File tree sources to load data from.

</td></tr>
<tr><td>

[libraries](./IChocolateEntityLibraryCreateParams.libraries.md)

</td><td>

`readonly`

</td><td>

[IInstantiatedEntityLibrarySources](IInstantiatedEntityLibrarySources.md)

</td><td>

Pre-instantiated LibraryRuntime.IInstantiatedLibrarySource | library sources.

</td></tr>
<tr><td>

[logger](./IChocolateEntityLibraryCreateParams.logger.md)

</td><td>

`readonly`

</td><td>

LogReporter&lt;unknown, unknown&gt;

</td><td>

Optional logger for reporting load/merge issues.

</td></tr>
</tbody></table>
