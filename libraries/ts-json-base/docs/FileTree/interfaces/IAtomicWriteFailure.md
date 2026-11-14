[Home](../../README.md) > [FileTree](../README.md) > IAtomicWriteFailure

# Interface: IAtomicWriteFailure

Classified detail for a failed atomic write.

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

[code](./IAtomicWriteFailure.code.md)

</td><td>

`readonly`

</td><td>

"unsupported" | "not-writable" | "io"

</td><td>

- `unsupported`: the store or destination does not support atomic
  writes, or the requested guarantee exceeds what the store can honor.

</td></tr>
<tr><td>

[stage](./IAtomicWriteFailure.stage.md)

</td><td>

`readonly`

</td><td>

"replace" | "validate" | "temporary-write" | "file-flush" | "directory-flush"

</td><td>

The protocol stage at which the failure occurred.

</td></tr>
<tr><td>

[visibility](./IAtomicWriteFailure.visibility.md)

</td><td>

`readonly`

</td><td>

"unknown" | "unchanged" | "replaced"

</td><td>

What a subsequent reader can now see for the destination path.

</td></tr>
</tbody></table>
