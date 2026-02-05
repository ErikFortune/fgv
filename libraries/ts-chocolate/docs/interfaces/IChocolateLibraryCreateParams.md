[Home](../README.md) > IChocolateLibraryCreateParams

# Interface: IChocolateLibraryCreateParams

Parameters for creating a LibraryRuntime.ChocolateLibrary | ChocolateLibrary.

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

[builtin](./IChocolateLibraryCreateParams.builtin.md)

</td><td>

`readonly`

</td><td>

[FullLibraryLoadSpec](../type-aliases/FullLibraryLoadSpec.md)

</td><td>

LibraryData.FullLibraryLoadSpec | Specifies built-in data loading for each sub-library.

</td></tr>
<tr><td>

[fileSources](./IChocolateLibraryCreateParams.fileSources.md)

</td><td>

`readonly`

</td><td>

[ILibraryFileTreeSource](ILibraryFileTreeSource.md) | readonly [ILibraryFileTreeSource](ILibraryFileTreeSource.md)[]

</td><td>

LibraryData.ILibraryFileTreeSource | File tree sources to load data from.

</td></tr>
<tr><td>

[libraries](./IChocolateLibraryCreateParams.libraries.md)

</td><td>

`readonly`

</td><td>

[IInstantiatedLibrarySource](IInstantiatedLibrarySource.md)

</td><td>

Pre-instantiated LibraryRuntime.IInstantiatedLibrarySource | library sources.

</td></tr>
<tr><td>

[logger](./IChocolateLibraryCreateParams.logger.md)

</td><td>

`readonly`

</td><td>

LogReporter&lt;unknown, unknown&gt;

</td><td>

Optional logger for reporting load/merge issues.

</td></tr>
</tbody></table>
