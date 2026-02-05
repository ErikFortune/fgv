[Home](../../README.md) > [LibraryRuntime](../README.md) > ILibraryRuntimeContextCreateParams

# Interface: ILibraryRuntimeContextCreateParams

Parameters for creating a LibraryRuntimeContext with a new library

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

[libraryParams](./ILibraryRuntimeContextCreateParams.libraryParams.md)

</td><td>

`readonly`

</td><td>

[IChocolateLibraryCreateParams](../../interfaces/IChocolateLibraryCreateParams.md)

</td><td>

Parameters for creating the underlying ChocolateLibrary

</td></tr>
<tr><td>

[preWarm](./ILibraryRuntimeContextCreateParams.preWarm.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether to pre-warm the reverse index on context creation.

</td></tr>
</tbody></table>
