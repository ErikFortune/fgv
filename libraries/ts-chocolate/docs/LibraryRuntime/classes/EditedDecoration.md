[Home](../../README.md) > [LibraryRuntime](../README.md) > EditedDecoration

# Class: EditedDecoration

Mutable wrapper for DecorationEntity with undo/redo support.
Provides editing methods that maintain history for undo/redo operations.

**Extends:** [`EditableWrapper<IDecorationEntity>`](../../classes/EditableWrapper.md)

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

[name](./EditedDecoration.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Gets the decoration name.

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

[create(initial)](./EditedDecoration.create.md)

</td><td>

`static`

</td><td>

Factory method for creating an EditedDecoration from an existing entity.

</td></tr>
<tr><td>

[restoreFromHistory(history)](./EditedDecoration.restoreFromHistory.md)

</td><td>

`static`

</td><td>

Factory method for restoring an EditedDecoration from serialized history.

</td></tr>
<tr><td>

[setName(name)](./EditedDecoration.setName.md)

</td><td>



</td><td>

Sets the decoration name.

</td></tr>
<tr><td>

[setDescription(description)](./EditedDecoration.setDescription.md)

</td><td>



</td><td>

Sets the decoration description.

</td></tr>
<tr><td>

[setIngredients(ingredients)](./EditedDecoration.setIngredients.md)

</td><td>



</td><td>

Sets the ingredients list.

</td></tr>
<tr><td>

[addIngredient(ingredient)](./EditedDecoration.addIngredient.md)

</td><td>



</td><td>

Adds an ingredient to the decoration.

</td></tr>
<tr><td>

[removeIngredient(index)](./EditedDecoration.removeIngredient.md)

</td><td>



</td><td>

Removes an ingredient from the decoration.

</td></tr>
<tr><td>

[updateIngredient(index, update)](./EditedDecoration.updateIngredient.md)

</td><td>



</td><td>

Updates an ingredient at the specified index.

</td></tr>
<tr><td>

[setProcedures(procedures)](./EditedDecoration.setProcedures.md)

</td><td>



</td><td>

Sets the procedures list.

</td></tr>
<tr><td>

[addProcedureRef(ref)](./EditedDecoration.addProcedureRef.md)

</td><td>



</td><td>

Adds a procedure reference to the decoration.

</td></tr>
<tr><td>

[removeProcedureRef(id)](./EditedDecoration.removeProcedureRef.md)

</td><td>



</td><td>

Removes a procedure reference from the decoration.

</td></tr>
<tr><td>

[setPreferredProcedure(id)](./EditedDecoration.setPreferredProcedure.md)

</td><td>



</td><td>

Sets the preferred procedure.

</td></tr>
<tr><td>

[setRatings(ratings)](./EditedDecoration.setRatings.md)

</td><td>



</td><td>

Sets the ratings list.

</td></tr>
<tr><td>

[setRating(category, score, notes)](./EditedDecoration.setRating.md)

</td><td>



</td><td>

Sets or updates a rating for a specific category.

</td></tr>
<tr><td>

[removeRating(category)](./EditedDecoration.removeRating.md)

</td><td>



</td><td>

Removes a rating for a specific category.

</td></tr>
<tr><td>

[setTags(tags)](./EditedDecoration.setTags.md)

</td><td>



</td><td>

Sets the tags list.

</td></tr>
<tr><td>

[setNotes(notes)](./EditedDecoration.setNotes.md)

</td><td>



</td><td>

Sets the notes list.

</td></tr>
<tr><td>

[applyUpdate(update)](./EditedDecoration.applyUpdate.md)

</td><td>



</td><td>

Applies a partial update to the current entity.

</td></tr>
<tr><td>

[hasChanges(original)](./EditedDecoration.hasChanges.md)

</td><td>



</td><td>

Checks if current state differs from original.

</td></tr>
<tr><td>

[getChanges(original)](./EditedDecoration.getChanges.md)

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
