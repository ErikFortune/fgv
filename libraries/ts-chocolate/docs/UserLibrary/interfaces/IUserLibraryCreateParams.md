[Home](../../README.md) > [UserLibrary](../README.md) > IUserLibraryCreateParams

# Interface: IUserLibraryCreateParams

Parameters for creating a UserLibrary.UserLibrary | UserLibrary.

User libraries have no built-in data - all data is user-provided.

Sources are processed in order:
1. File tree sources (in array order)
2. Pre-instantiated libraries (merged in)

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

[fileSources](./IUserLibraryCreateParams.fileSources.md)

</td><td>

`readonly`

</td><td>

[ILibraryFileTreeSource](../../interfaces/ILibraryFileTreeSource.md) | readonly [ILibraryFileTreeSource](../../interfaces/ILibraryFileTreeSource.md)[]

</td><td>

File tree sources to load data from.

</td></tr>
<tr><td>

[libraries](./IUserLibraryCreateParams.libraries.md)

</td><td>

`readonly`

</td><td>

[IInstantiatedUserLibrarySource](../../interfaces/IInstantiatedUserLibrarySource.md)

</td><td>

Pre-instantiated library sources.

</td></tr>
<tr><td>

[logger](./IUserLibraryCreateParams.logger.md)

</td><td>

`readonly`

</td><td>

ILogger

</td><td>

Logger for library operations.

</td></tr>
</tbody></table>
