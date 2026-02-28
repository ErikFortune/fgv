[Home](../../README.md) > [LibraryRuntime](../README.md) > EditableWrapper

# Class: EditableWrapper

Generic base class for mutable entity wrappers with undo/redo support.

Provides the common undo/redo stack, snapshot management, and serialization
infrastructure shared by all Edited* and Produced* wrappers. Subclasses
implement domain-specific editing methods and the `_deepCopy` strategy.

**Implements:** [`ISnapshotProvider<T>`](../../interfaces/ISnapshotProvider.md)

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

[initial](./EditableWrapper.initial.md)

</td><td>

`readonly`

</td><td>

T

</td><td>

Gets the initial entity state at creation time (direct reference — callers should not mutate).

</td></tr>
<tr><td>

[snapshot](./EditableWrapper.snapshot.md)

</td><td>

`readonly`

</td><td>

T

</td><td>

Gets the current state as an immutable snapshot.

</td></tr>
<tr><td>

[current](./EditableWrapper.current.md)

</td><td>

`readonly`

</td><td>

T

</td><td>

Gets the current entity (direct reference — callers should not mutate).

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[createSnapshot()](./EditableWrapper.createSnapshot.md)

</td><td>



</td><td>

Creates an immutable snapshot of the current state.

</td></tr>
<tr><td>

[restoreSnapshot(snapshot)](./EditableWrapper.restoreSnapshot.md)

</td><td>



</td><td>

Restores state from a snapshot.

</td></tr>
<tr><td>

[getSerializedHistory(original)](./EditableWrapper.getSerializedHistory.md)

</td><td>



</td><td>

Serializes the complete editing history for persistence.

</td></tr>
<tr><td>

[undo()](./EditableWrapper.undo.md)

</td><td>



</td><td>

Undoes the last change.

</td></tr>
<tr><td>

[redo()](./EditableWrapper.redo.md)

</td><td>



</td><td>

Redoes the last undone change.

</td></tr>
<tr><td>

[canUndo()](./EditableWrapper.canUndo.md)

</td><td>



</td><td>

Checks if undo is available.

</td></tr>
<tr><td>

[canRedo()](./EditableWrapper.canRedo.md)

</td><td>



</td><td>

Checks if redo is available.

</td></tr>
</tbody></table>
