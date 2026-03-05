[Home](../../README.md) > [LibraryRuntime](../README.md) > ProducedFilling

# Class: ProducedFilling

Mutable wrapper for IProducedFilling with undo/redo support.
Provides editing methods that maintain history for undo/redo operations.

**Extends:** [`EditableWrapper<IProducedFillingEntity>`](../../classes/EditableWrapper.md)

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

[variationId](./ProducedFilling.variationId.md)

</td><td>

`readonly`

</td><td>

[FillingRecipeVariationId](../../type-aliases/FillingRecipeVariationId.md)

</td><td>

Gets the variation ID.

</td></tr>
<tr><td>

[targetWeight](./ProducedFilling.targetWeight.md)

</td><td>

`readonly`

</td><td>

[Measurement](../../type-aliases/Measurement.md)

</td><td>

Gets the target weight.

</td></tr>
<tr><td>

[ingredients](./ProducedFilling.ingredients.md)

</td><td>

`readonly`

</td><td>

readonly [IProducedFillingIngredientEntity](../../interfaces/IProducedFillingIngredientEntity.md)[]

</td><td>

Gets the ingredients as a readonly array.

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

[create(initial)](./ProducedFilling.create.md)

</td><td>

`static`

</td><td>

Factory method for creating a ProducedFilling from an existing produced filling.

</td></tr>
<tr><td>

[fromSource(source, scaleFactor)](./ProducedFilling.fromSource.md)

</td><td>

`static`

</td><td>

Factory method for creating a ProducedFilling from a source recipe variation.

</td></tr>
<tr><td>

[restoreFromHistory(history)](./ProducedFilling.restoreFromHistory.md)

</td><td>

`static`

</td><td>

Factory method for restoring a ProducedFilling from serialized history.

</td></tr>
<tr><td>

[toSourceVariation(snapshot, newVariationSpec, createdDate)](./ProducedFilling.toSourceVariation.md)

</td><td>

`static`

</td><td>

Converts a produced filling entity back to a source recipe variation entity.

</td></tr>
<tr><td>

[mergeAsAlternatives(produced, original)](./ProducedFilling.mergeAsAlternatives.md)

</td><td>

`static`

</td><td>

Merges produced ingredient choices as alternatives into the original variation.

</td></tr>
<tr><td>

[setIngredient(id, amount, unit, modifiers)](./ProducedFilling.setIngredient.md)

</td><td>



</td><td>

Sets or updates an ingredient.

</td></tr>
<tr><td>

[replaceIngredient(oldId, newId, amount, unit, modifiers)](./ProducedFilling.replaceIngredient.md)

</td><td>



</td><td>

Replaces an existing ingredient with a new one at the same position.

</td></tr>
<tr><td>

[removeIngredient(id)](./ProducedFilling.removeIngredient.md)

</td><td>



</td><td>

Removes an ingredient.

</td></tr>
<tr><td>

[scaleToTargetWeight(targetWeight)](./ProducedFilling.scaleToTargetWeight.md)

</td><td>



</td><td>

Scales all weight-contributing ingredients to achieve a target weight.

</td></tr>
<tr><td>

[setNotes(notes)](./ProducedFilling.setNotes.md)

</td><td>



</td><td>

Sets the notes.

</td></tr>
<tr><td>

[setProcedure(id)](./ProducedFilling.setProcedure.md)

</td><td>



</td><td>

Sets the procedure.

</td></tr>
<tr><td>

[hasChanges(original)](./ProducedFilling.hasChanges.md)

</td><td>



</td><td>

Checks if current state differs from original.

</td></tr>
<tr><td>

[getChanges(original)](./ProducedFilling.getChanges.md)

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
