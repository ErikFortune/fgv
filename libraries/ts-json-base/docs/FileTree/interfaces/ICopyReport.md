[Home](../../README.md) > [FileTree](../README.md) > ICopyReport

# Interface: ICopyReport

What a copy did.

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

[filesCopiedAsBytes](./ICopyReport.filesCopiedAsBytes.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Files written verbatim as bytes.

</td></tr>
<tr><td>

[filesCopiedAsText](./ICopyReport.filesCopiedAsText.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Files written as text, after verifying that re-encoding that text reproduces the

</td></tr>
<tr><td>

[directoriesCreated](./ICopyReport.directoriesCreated.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Directories created in the destination.

</td></tr>
<tr><td>

[skipped](./ICopyReport.skipped.md)

</td><td>

`readonly`

</td><td>

readonly [ISkippedCopyFile](../../interfaces/ISkippedCopyFile.md)[]

</td><td>

Files left behind, empty unless

</td></tr>
</tbody></table>
