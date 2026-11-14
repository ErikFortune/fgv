[Home](../../README.md) > [FileTree](../README.md) > ISkippedCopyFile

# Interface: ISkippedCopyFile

A file a copy left behind under
FileTree.CopyUnfaithfulFileBehavior | `onUnfaithfulFile: 'skip'`.

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

[sourcePath](./ISkippedCopyFile.sourcePath.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Absolute path of the source file.

</td></tr>
<tr><td>

[destinationPath](./ISkippedCopyFile.destinationPath.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Path the file would have occupied in the destination.

</td></tr>
<tr><td>

[message](./ISkippedCopyFile.message.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

A message naming both paths, identical to the one a `fail` would have reported.

</td></tr>
</tbody></table>
