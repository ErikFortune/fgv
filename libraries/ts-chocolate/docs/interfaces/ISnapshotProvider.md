[Home](../README.md) > ISnapshotProvider

# Interface: ISnapshotProvider

Implemented by any mutable wrapper that can produce an immutable snapshot of its current state.
Used by EditorContext.updateFromWrapper to persist editable wrapper state without
coupling the editor context to a specific wrapper implementation.

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

[snapshot](./ISnapshotProvider.snapshot.md)

</td><td>

`readonly`

</td><td>

T

</td><td>

Gets an immutable snapshot of the current entity state.

</td></tr>
</tbody></table>
