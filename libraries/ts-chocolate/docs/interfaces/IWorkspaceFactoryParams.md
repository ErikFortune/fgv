[Home](../README.md) > IWorkspaceFactoryParams

# Interface: IWorkspaceFactoryParams

Parameters for creating a workspace with platform-specific defaults.
Used by platform factory functions.

**Extends:** `Omit<IWorkspaceCreateParams, "keyStore">`

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

[keyStoreFile](./IWorkspaceFactoryParams.keyStoreFile.md)

</td><td>

`readonly`

</td><td>

IKeyStoreFile

</td><td>

Key store file data to load.

</td></tr>
<tr><td>

[journals](./IWorkspaceCreateParams.journals.md)

</td><td>

`readonly`

</td><td>

[JournalLibrary](../classes/JournalLibrary.md)

</td><td>

Pre-instantiated journal library.

</td></tr>
<tr><td>

[encryption](./IWorkspaceCreateParams.encryption.md)

</td><td>

`readonly`

</td><td>

Partial&lt;Omit&lt;[IEncryptionConfig](IEncryptionConfig.md), "secretProvider"&gt;&gt;

</td><td>

Additional encryption configuration options.

</td></tr>
<tr><td>

[fileSources](./IWorkspaceCreateParams.fileSources.md)

</td><td>

`readonly`

</td><td>

[ILibraryFileTreeSource](ILibraryFileTreeSource.md) | readonly [ILibraryFileTreeSource](ILibraryFileTreeSource.md)[]

</td><td>

File tree sources to load data from.

</td></tr>
<tr><td>

[builtin](./IWorkspaceCreateParams.builtin.md)

</td><td>

`readonly`

</td><td>

[FullLibraryLoadSpec](../type-aliases/FullLibraryLoadSpec.md)

</td><td>

Specifies built-in data loading for each sub-library.

</td></tr>
<tr><td>

[logger](./IWorkspaceCreateParams.logger.md)

</td><td>

`readonly`

</td><td>

LogReporter&lt;unknown, unknown&gt;

</td><td>

Logger for workspace operations.

</td></tr>
<tr><td>

[libraries](./IWorkspaceCreateParams.libraries.md)

</td><td>

`readonly`

</td><td>

[IInstantiatedLibrarySource](IInstantiatedLibrarySource.md)

</td><td>

Pre-instantiated library sources.

</td></tr>
<tr><td>

[userFileSources](./IWorkspaceCreateParams.userFileSources.md)

</td><td>

`readonly`

</td><td>

[ILibraryFileTreeSource](ILibraryFileTreeSource.md) | readonly [ILibraryFileTreeSource](ILibraryFileTreeSource.md)[]

</td><td>

File tree sources for user-specific data (journals, future inventory).

</td></tr>
<tr><td>

[preWarm](./IWorkspaceCreateParams.preWarm.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether to pre-warm the runtime caches on creation.

</td></tr>
</tbody></table>
