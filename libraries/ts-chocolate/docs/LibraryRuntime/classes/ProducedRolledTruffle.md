[Home](../../README.md) > [LibraryRuntime](../README.md) > ProducedRolledTruffle

# Class: ProducedRolledTruffle

Mutable wrapper for IProducedRolledTruffle with undo/redo support.
Provides rolled truffle-specific editing methods.

**Extends:** [`ProducedConfectionBase<IProducedRolledTruffleEntity>`](../../classes/ProducedConfectionBase.md)

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

[enrobingChocolateId](./ProducedRolledTruffle.enrobingChocolateId.md)

</td><td>

`readonly`

</td><td>

[IngredientId](../../type-aliases/IngredientId.md) | undefined

</td><td>

Gets the enrobing chocolate ID.

</td></tr>
<tr><td>

[coatingId](./ProducedRolledTruffle.coatingId.md)

</td><td>

`readonly`

</td><td>

[IngredientId](../../type-aliases/IngredientId.md) | undefined

</td><td>

Gets the coating ID.

</td></tr>
<tr><td>

[snapshot](./ProducedConfectionBase.snapshot.md)

</td><td>

`readonly`

</td><td>

T

</td><td>

Gets the current state as an immutable snapshot.

</td></tr>
<tr><td>

[variationId](./ProducedConfectionBase.variationId.md)

</td><td>

`readonly`

</td><td>

[ConfectionRecipeVariationId](../../type-aliases/ConfectionRecipeVariationId.md)

</td><td>

Gets the variation ID.

</td></tr>
<tr><td>

[yield](./ProducedConfectionBase.yield.md)

</td><td>

`readonly`

</td><td>

[IConfectionYield](../../interfaces/IConfectionYield.md)

</td><td>

Gets the yield specification.

</td></tr>
<tr><td>

[fillings](./ProducedConfectionBase.fillings.md)

</td><td>

`readonly`

</td><td>

readonly [AnyResolvedFillingSlotEntity](../../type-aliases/AnyResolvedFillingSlotEntity.md)[] | undefined

</td><td>

Gets the fillings as a readonly array.

</td></tr>
<tr><td>

[notes](./ProducedConfectionBase.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[] | undefined

</td><td>

Gets the notes as a readonly array.

</td></tr>
<tr><td>

[current](./ProducedConfectionBase.current.md)

</td><td>

`readonly`

</td><td>

T

</td><td>

Gets the current produced confection.

</td></tr>
<tr><td>

[procedureId](./ProducedConfectionBase.procedureId.md)

</td><td>

`readonly`

</td><td>

[ProcedureId](../../type-aliases/ProcedureId.md) | undefined

</td><td>

Gets the procedure ID.

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

[create(initial)](./ProducedRolledTruffle.create.md)

</td><td>

`static`

</td><td>

Factory method for creating a ProducedRolledTruffle from an existing produced rolled truffle.

</td></tr>
<tr><td>

[fromSource(source)](./ProducedRolledTruffle.fromSource.md)

</td><td>

`static`

</td><td>

Factory method for creating a ProducedRolledTruffle from a source variation.

</td></tr>
<tr><td>

[restoreFromHistory(history)](./ProducedRolledTruffle.restoreFromHistory.md)

</td><td>

`static`

</td><td>

Restores a ProducedRolledTruffle from serialized editing history.

</td></tr>
<tr><td>

[setEnrobingChocolate(chocolateId)](./ProducedRolledTruffle.setEnrobingChocolate.md)

</td><td>



</td><td>

Sets the enrobing chocolate.

</td></tr>
<tr><td>

[setCoating(coatingId)](./ProducedRolledTruffle.setCoating.md)

</td><td>



</td><td>

Sets the coating.

</td></tr>
<tr><td>

[getChanges(original)](./ProducedRolledTruffle.getChanges.md)

</td><td>



</td><td>

Gets detailed changes between current state and original.

</td></tr>
<tr><td>

[createSnapshot()](./ProducedConfectionBase.createSnapshot.md)

</td><td>



</td><td>

Creates an immutable snapshot of the current state.

</td></tr>
<tr><td>

[restoreSnapshot(snapshot)](./ProducedConfectionBase.restoreSnapshot.md)

</td><td>



</td><td>

Restores state from a snapshot.

</td></tr>
<tr><td>

[undo()](./ProducedConfectionBase.undo.md)

</td><td>



</td><td>

Undoes the last change.

</td></tr>
<tr><td>

[redo()](./ProducedConfectionBase.redo.md)

</td><td>



</td><td>

Redoes the last undone change.

</td></tr>
<tr><td>

[canUndo()](./ProducedConfectionBase.canUndo.md)

</td><td>



</td><td>

Checks if undo is available.

</td></tr>
<tr><td>

[canRedo()](./ProducedConfectionBase.canRedo.md)

</td><td>



</td><td>

Checks if redo is available.

</td></tr>
<tr><td>

[getSerializedHistory(original)](./ProducedConfectionBase.getSerializedHistory.md)

</td><td>



</td><td>

Gets the serialized editing history for persistence.

</td></tr>
<tr><td>

[setNotes(notes)](./ProducedConfectionBase.setNotes.md)

</td><td>



</td><td>

Sets the notes.

</td></tr>
<tr><td>

[setProcedure(id)](./ProducedConfectionBase.setProcedure.md)

</td><td>



</td><td>

Sets the procedure.

</td></tr>
<tr><td>

[scaleToYield(yieldSpec)](./ProducedConfectionBase.scaleToYield.md)

</td><td>



</td><td>

Scales to a new yield specification.

</td></tr>
<tr><td>

[setFillingSlot(slotId, choice)](./ProducedConfectionBase.setFillingSlot.md)

</td><td>



</td><td>

Sets or updates a filling slot.

</td></tr>
<tr><td>

[removeFillingSlot(slotId)](./ProducedConfectionBase.removeFillingSlot.md)

</td><td>



</td><td>

Removes a filling slot.

</td></tr>
<tr><td>

[hasChanges(original)](./ProducedConfectionBase.hasChanges.md)

</td><td>



</td><td>

Checks if current state differs from original.

</td></tr>
</tbody></table>
