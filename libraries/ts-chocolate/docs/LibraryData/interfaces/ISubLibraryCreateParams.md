[Home](../../README.md) > [LibraryData](../README.md) > ISubLibraryCreateParams

# Interface: ISubLibraryCreateParams

Parameters for constructing a SubLibrary with full loading support.

This interface extends the base collection parameters with factory functions
that allow the base class to handle all loading logic.

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

[itemIdConverter](./ISubLibraryCreateParams.itemIdConverter.md)

</td><td>

`readonly`

</td><td>

Converter&lt;TBaseId, unknown&gt; | Validator&lt;TBaseId, unknown&gt;

</td><td>

Converter or validator for item IDs within collections.

</td></tr>
<tr><td>

[itemConverter](./ISubLibraryCreateParams.itemConverter.md)

</td><td>

`readonly`

</td><td>

Converter&lt;TItem, unknown&gt; | Validator&lt;TItem, unknown&gt;

</td><td>

Converter or validator for items within collections.

</td></tr>
<tr><td>

[directoryNavigator](./ISubLibraryCreateParams.directoryNavigator.md)

</td><td>

`readonly`

</td><td>

[SubLibraryDirectoryNavigator](../../type-aliases/SubLibraryDirectoryNavigator.md)

</td><td>

Function that navigates from library root to the data directory.

</td></tr>
<tr><td>

[builtInTreeProvider](./ISubLibraryCreateParams.builtInTreeProvider.md)

</td><td>

`readonly`

</td><td>

[SubLibraryBuiltInTreeProvider](../../type-aliases/SubLibraryBuiltInTreeProvider.md)

</td><td>

Function that provides the built-in library tree.

</td></tr>
<tr><td>

[libraryParams](./ISubLibraryCreateParams.libraryParams.md)

</td><td>

`readonly`

</td><td>

[ISubLibraryParams](../../interfaces/ISubLibraryParams.md)&lt;TLibrary, [SubLibraryEntryInit](../../type-aliases/SubLibraryEntryInit.md)&lt;TBaseId, TItem&gt;&gt;

</td><td>

Library creation parameters (builtin, fileSources, collections, mergeLibraries).

</td></tr>
<tr><td>

[logger](./ISubLibraryCreateParams.logger.md)

</td><td>

`readonly`

</td><td>

LogReporter&lt;unknown, unknown&gt;

</td><td>

Optional logger for reporting loading progress and issues.

</td></tr>
</tbody></table>
