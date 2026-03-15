[Home](../../../README.md) > [Entities](../../README.md) > [Session](../README.md) > ISerializedEditingHistoryEntity

# Interface: ISerializedEditingHistoryEntity

Serialized undo/redo history for any editable entity.
Captures the full editing state for restoration.

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

[current](./ISerializedEditingHistoryEntity.current.md)

</td><td>

`readonly`

</td><td>

T

</td><td>

Current editing state

</td></tr>
<tr><td>

[original](./ISerializedEditingHistoryEntity.original.md)

</td><td>

`readonly`

</td><td>

T

</td><td>

Original state when session started (for change detection)

</td></tr>
<tr><td>

[undoStack](./ISerializedEditingHistoryEntity.undoStack.md)

</td><td>

`readonly`

</td><td>

readonly T[]

</td><td>

Undo stack - states that can be restored

</td></tr>
<tr><td>

[redoStack](./ISerializedEditingHistoryEntity.redoStack.md)

</td><td>

`readonly`

</td><td>

readonly T[]

</td><td>

Redo stack - states that were undone and can be reapplied

</td></tr>
</tbody></table>
