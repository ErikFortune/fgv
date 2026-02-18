[Home](../README.md) > EditedIngredient

# Class: EditedIngredient

Mutable wrapper for IngredientEntity with undo/redo support.
Provides editing methods that maintain history for undo/redo operations.
Named "Edited" rather than "Produced" since ingredients are not produced.

**Extends:** [`EditableWrapper<IngredientEntity>`](EditableWrapper.md)

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

[name](./EditedIngredient.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Gets the ingredient name.

</td></tr>
<tr><td>

[category](./EditedIngredient.category.md)

</td><td>

`readonly`

</td><td>

[IngredientCategory](../type-aliases/IngredientCategory.md)

</td><td>

Gets the ingredient category.

</td></tr>
<tr><td>

[ganacheCharacteristics](./EditedIngredient.ganacheCharacteristics.md)

</td><td>

`readonly`

</td><td>

[IGanacheCharacteristics](../interfaces/IGanacheCharacteristics.md)

</td><td>

Gets the ganache characteristics.

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

[create(initial)](./EditedIngredient.create.md)

</td><td>

`static`

</td><td>

Factory method for creating an EditedIngredient from an existing entity.

</td></tr>
<tr><td>

[restoreFromHistory(history)](./EditedIngredient.restoreFromHistory.md)

</td><td>

`static`

</td><td>

Factory method for restoring an EditedIngredient from serialized history.

</td></tr>
<tr><td>

[setName(name)](./EditedIngredient.setName.md)

</td><td>



</td><td>

Sets the ingredient name.

</td></tr>
<tr><td>

[setDescription(description)](./EditedIngredient.setDescription.md)

</td><td>



</td><td>

Sets the ingredient description.

</td></tr>
<tr><td>

[setManufacturer(manufacturer)](./EditedIngredient.setManufacturer.md)

</td><td>



</td><td>

Sets the ingredient manufacturer.

</td></tr>
<tr><td>

[setGanacheCharacteristics(ganacheCharacteristics)](./EditedIngredient.setGanacheCharacteristics.md)

</td><td>



</td><td>

Sets the ganache characteristics.

</td></tr>
<tr><td>

[setAllergens(allergens)](./EditedIngredient.setAllergens.md)

</td><td>



</td><td>

Sets the allergens list.

</td></tr>
<tr><td>

[setTraceAllergens(traceAllergens)](./EditedIngredient.setTraceAllergens.md)

</td><td>



</td><td>

Sets the trace allergens list.

</td></tr>
<tr><td>

[setCertifications(certifications)](./EditedIngredient.setCertifications.md)

</td><td>



</td><td>

Sets the certifications list.

</td></tr>
<tr><td>

[setVegan(vegan)](./EditedIngredient.setVegan.md)

</td><td>



</td><td>

Sets the vegan status.

</td></tr>
<tr><td>

[setTags(tags)](./EditedIngredient.setTags.md)

</td><td>



</td><td>

Sets the tags list.

</td></tr>
<tr><td>

[setDensity(density)](./EditedIngredient.setDensity.md)

</td><td>



</td><td>

Sets the density.

</td></tr>
<tr><td>

[setPhase(phase)](./EditedIngredient.setPhase.md)

</td><td>



</td><td>

Sets the physical phase.

</td></tr>
<tr><td>

[setMeasurementUnits(measurementUnits)](./EditedIngredient.setMeasurementUnits.md)

</td><td>



</td><td>

Sets the measurement units.

</td></tr>
<tr><td>

[setUrls(urls)](./EditedIngredient.setUrls.md)

</td><td>



</td><td>

Sets the URLs list.

</td></tr>
<tr><td>

[setNotes(notes)](./EditedIngredient.setNotes.md)

</td><td>



</td><td>

Sets the notes list.

</td></tr>
<tr><td>

[applyUpdate(update)](./EditedIngredient.applyUpdate.md)

</td><td>



</td><td>

Applies a partial update to the current entity.

</td></tr>
<tr><td>

[hasChanges(original)](./EditedIngredient.hasChanges.md)

</td><td>



</td><td>

Checks if current state differs from original.

</td></tr>
<tr><td>

[getChanges(original)](./EditedIngredient.getChanges.md)

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
