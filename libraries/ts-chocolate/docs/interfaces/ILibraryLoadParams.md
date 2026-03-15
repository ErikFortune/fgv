[Home](../README.md) > ILibraryLoadParams

# Interface: ILibraryLoadParams

Fine-grained parameters for controlling which collections from a library to load.

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

[included](./ILibraryLoadParams.included.md)

</td><td>

`readonly`

</td><td>

readonly [FilterPattern](../type-aliases/FilterPattern.md)[]

</td><td>

Patterns to include.

</td></tr>
<tr><td>

[excluded](./ILibraryLoadParams.excluded.md)

</td><td>

`readonly`

</td><td>

readonly [FilterPattern](../type-aliases/FilterPattern.md)[]

</td><td>

Patterns to exclude.

</td></tr>
<tr><td>

[recurseWithDelimiter](./ILibraryLoadParams.recurseWithDelimiter.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Whether to recurse into subdirectories and use a delimiter to form composite collection names.

</td></tr>
</tbody></table>
