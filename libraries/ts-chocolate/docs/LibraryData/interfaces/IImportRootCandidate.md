[Home](../../README.md) > [LibraryData](../README.md) > IImportRootCandidate

# Interface: IImportRootCandidate

A candidate import root with directory and resolution kind.
Used internally during BFS search and as the result of tryResolveAt.

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
