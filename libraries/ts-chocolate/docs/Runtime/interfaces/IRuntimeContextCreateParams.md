[Home](../../README.md) > [Runtime](../README.md) > IRuntimeContextCreateParams

# Interface: IRuntimeContextCreateParams

Parameters for creating a RuntimeContext with a new library

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

[libraryParams](./IRuntimeContextCreateParams.libraryParams.md)

</td><td>

`readonly`

</td><td>

[IEntityLibraryCreateParams](../../interfaces/IEntityLibraryCreateParams.md)

</td><td>

Parameters for creating the underlying ChocolateLibrary

</td></tr>
<tr><td>

[preWarm](./IRuntimeContextCreateParams.preWarm.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether to pre-warm the reverse index on context creation.

</td></tr>
</tbody></table>
