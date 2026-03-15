[Home](../README.md) > EditedTask

# Class: EditedTask

Mutable wrapper for IRawTaskEntity with undo/redo support.
Provides editing methods that maintain history for undo/redo operations.

**Extends:** [`EditableWrapper<IRawTaskEntity>`](EditableWrapper.md)

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

[name](./EditedTask.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Gets the task name.

</td></tr>
<tr><td>

[template](./EditedTask.template.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Gets the template string.

</td></tr>
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

[create(initial)](./EditedTask.create.md)

</td><td>

`static`

</td><td>

Factory method for creating an EditedTask from an existing entity.

</td></tr>
<tr><td>

[restoreFromHistory(history)](./EditedTask.restoreFromHistory.md)

</td><td>

`static`

</td><td>

Factory method for restoring an EditedTask from serialized history.

</td></tr>
<tr><td>

[setName(name)](./EditedTask.setName.md)

</td><td>



</td><td>

Sets the task name.

</td></tr>
<tr><td>

[setTemplate(template)](./EditedTask.setTemplate.md)

</td><td>



</td><td>

Sets the Mustache template string.

</td></tr>
<tr><td>

[setDefaultActiveTime(defaultActiveTime)](./EditedTask.setDefaultActiveTime.md)

</td><td>



</td><td>

Sets the default active time.

</td></tr>
<tr><td>

[setDefaultWaitTime(defaultWaitTime)](./EditedTask.setDefaultWaitTime.md)

</td><td>



</td><td>

Sets the default wait time.

</td></tr>
<tr><td>

[setDefaultHoldTime(defaultHoldTime)](./EditedTask.setDefaultHoldTime.md)

</td><td>



</td><td>

Sets the default hold time.

</td></tr>
<tr><td>

[setDefaultTemperature(defaultTemperature)](./EditedTask.setDefaultTemperature.md)

</td><td>



</td><td>

Sets the default temperature.

</td></tr>
<tr><td>

[setNotes(notes)](./EditedTask.setNotes.md)

</td><td>



</td><td>

Sets the notes list.

</td></tr>
<tr><td>

[setTags(tags)](./EditedTask.setTags.md)

</td><td>



</td><td>

Sets the tags list.

</td></tr>
<tr><td>

[setDefaults(defaults)](./EditedTask.setDefaults.md)

</td><td>



</td><td>

Sets the default values for template placeholders.

</td></tr>
<tr><td>

[applyUpdate(update)](./EditedTask.applyUpdate.md)

</td><td>



</td><td>

Applies a partial update to the current entity.

</td></tr>
<tr><td>

[hasChanges(original)](./EditedTask.hasChanges.md)

</td><td>



</td><td>

Checks if current state differs from original.

</td></tr>
<tr><td>

[getChanges(original)](./EditedTask.getChanges.md)

</td><td>



</td><td>

Gets detailed changes between current state and original.

</td></tr>
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
