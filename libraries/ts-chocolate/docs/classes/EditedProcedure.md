[Home](../README.md) > EditedProcedure

# Class: EditedProcedure

Mutable wrapper for IProcedureEntity with undo/redo support.

**Extends:** [`EditableWrapper<IProcedureEntity>`](EditableWrapper.md)

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

[name](./EditedProcedure.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>



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

[create(initial)](./EditedProcedure.create.md)

</td><td>

`static`

</td><td>



</td></tr>
<tr><td>

[restoreFromHistory(history)](./EditedProcedure.restoreFromHistory.md)

</td><td>

`static`

</td><td>



</td></tr>
<tr><td>

[setName(name)](./EditedProcedure.setName.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[setDescription(description)](./EditedProcedure.setDescription.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[setCategory(category)](./EditedProcedure.setCategory.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[setTags(tags)](./EditedProcedure.setTags.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[setNotes(notes)](./EditedProcedure.setNotes.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[setSteps(steps)](./EditedProcedure.setSteps.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[addStep(step)](./EditedProcedure.addStep.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[updateStep(order, update)](./EditedProcedure.updateStep.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[removeStep(order)](./EditedProcedure.removeStep.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[moveStep(order, newIndex)](./EditedProcedure.moveStep.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[applyUpdate(update)](./EditedProcedure.applyUpdate.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[hasChanges(original)](./EditedProcedure.hasChanges.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[getChanges(original)](./EditedProcedure.getChanges.md)

</td><td>



</td><td>



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
