[Home](../README.md) > ICommonWorkspaceInitParams

# Interface: ICommonWorkspaceInitParams

Parameters for common workspace initialization (Stage 2).
Takes the platform-resolved resources and creates a workspace.

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

[platformInit](./ICommonWorkspaceInitParams.platformInit.md)

</td><td>

`readonly`

</td><td>

[IPlatformInitResult](IPlatformInitResult.md)

</td><td>

The result from platform initialization (Stage 1).

</td></tr>
<tr><td>

[builtin](./ICommonWorkspaceInitParams.builtin.md)

</td><td>

`readonly`

</td><td>

[FullLibraryLoadSpec](../type-aliases/FullLibraryLoadSpec.md)

</td><td>

Specifies built-in data loading for each sub-library.

</td></tr>
<tr><td>

[additionalFileSources](./ICommonWorkspaceInitParams.additionalFileSources.md)

</td><td>

`readonly`

</td><td>

readonly [ILibraryFileTreeSource](ILibraryFileTreeSource.md)[]

</td><td>

Additional file tree sources beyond those from platform init.

</td></tr>
<tr><td>

[preWarm](./ICommonWorkspaceInitParams.preWarm.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether to pre-warm the runtime caches on creation.

</td></tr>
<tr><td>

[logger](./ICommonWorkspaceInitParams.logger.md)

</td><td>

`readonly`

</td><td>

LogReporter&lt;unknown, unknown&gt;

</td><td>

Optional logger for workspace operations.

</td></tr>
</tbody></table>
