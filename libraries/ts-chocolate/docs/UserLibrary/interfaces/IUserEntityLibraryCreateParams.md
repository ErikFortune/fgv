[Home](../../README.md) > [UserLibrary](../README.md) > IUserEntityLibraryCreateParams

# Interface: IUserEntityLibraryCreateParams

Parameters for creating a UserLibrary.UserEntityLibrary | UserEntityLibrary.

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

[fileSources](./IUserEntityLibraryCreateParams.fileSources.md)

</td><td>

`readonly`

</td><td>

[ILibraryFileTreeSource](../../interfaces/ILibraryFileTreeSource.md) | readonly [ILibraryFileTreeSource](../../interfaces/ILibraryFileTreeSource.md)[]

</td><td>

File tree sources to load data from.

</td></tr>
<tr><td>

[libraries](./IUserEntityLibraryCreateParams.libraries.md)

</td><td>

`readonly`

</td><td>

[IInstantiatedUserEntityLibrarySource](../../interfaces/IInstantiatedUserEntityLibrarySource.md)

</td><td>

Pre-instantiated library sources.

</td></tr>
<tr><td>

[logger](./IUserEntityLibraryCreateParams.logger.md)

</td><td>

`readonly`

</td><td>

ILogger

</td><td>

Logger for library operations.

</td></tr>
</tbody></table>
