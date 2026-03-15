[Home](../../README.md) > [LibraryData](../README.md) > IResolveImportRootOptions

# Interface: IResolveImportRootOptions

Options for importing a directory for a specific sub-library.

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

[maxDepth](./IResolveImportRootOptions.maxDepth.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Maximum directory depth to search beneath the provided root.

</td></tr>
<tr><td>

[visitLimit](./IResolveImportRootOptions.visitLimit.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Maximum directories to visit.

</td></tr>
<tr><td>

[matchLimit](./IResolveImportRootOptions.matchLimit.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Maximum candidate matches to count before stopping.

</td></tr>
<tr><td>

[allowLooseFiles](./IResolveImportRootOptions.allowLooseFiles.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether to treat loose *.json/*.yaml/*.yml files in a directory as collections.

</td></tr>
</tbody></table>
