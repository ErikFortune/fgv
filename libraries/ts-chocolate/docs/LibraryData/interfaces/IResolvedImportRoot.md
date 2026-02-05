[Home](../../README.md) > [LibraryData](../README.md) > IResolvedImportRoot

# Interface: IResolvedImportRoot

Result of importing a directory for a specific sub-library.

**Extends:** [`IImportRootCandidate`](../../interfaces/IImportRootCandidate.md)

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

[visited](./IResolvedImportRoot.visited.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Number of directories visited during search.

</td></tr>
<tr><td>

[matches](./IResolvedImportRoot.matches.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Number of matching candidates found.

</td></tr>
<tr><td>

[root](./IImportRootCandidate.root.md)

</td><td>

`readonly`

</td><td>

IFileTreeDirectoryItem

</td><td>

The directory that can be treated as the library root.

</td></tr>
<tr><td>

[kind](./IImportRootCandidate.kind.md)

</td><td>

`readonly`

</td><td>

[ImportRootKind](../../type-aliases/ImportRootKind.md)

</td><td>

How the resolution was achieved.

</td></tr>
</tbody></table>
