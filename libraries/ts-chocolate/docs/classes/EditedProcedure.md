[Home](../README.md) > EditedProcedure

# Class: EditedProcedure

Mutable wrapper for IProcedureEntity with undo/redo support.

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

[snapshot](./EditedProcedure.snapshot.md)

</td><td>

`readonly`

</td><td>

[IProcedureEntity](../interfaces/IProcedureEntity.md)

</td><td>



</td></tr>
<tr><td>

[current](./EditedProcedure.current.md)

</td><td>

`readonly`

</td><td>

[IProcedureEntity](../interfaces/IProcedureEntity.md)

</td><td>



</td></tr>
<tr><td>

[name](./EditedProcedure.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>



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

[createSnapshot()](./EditedProcedure.createSnapshot.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[restoreSnapshot(snapshot)](./EditedProcedure.restoreSnapshot.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[getSerializedHistory(original)](./EditedProcedure.getSerializedHistory.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[undo()](./EditedProcedure.undo.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[redo()](./EditedProcedure.redo.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[canUndo()](./EditedProcedure.canUndo.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[canRedo()](./EditedProcedure.canRedo.md)

</td><td>



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
</tbody></table>
