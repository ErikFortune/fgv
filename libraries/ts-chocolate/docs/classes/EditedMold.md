[Home](../README.md) > EditedMold

# Class: EditedMold

Mutable wrapper for IMoldEntity with undo/redo support.
Provides editing methods that maintain history for undo/redo operations.

**Extends:** [`EditableWrapper<IMoldEntity>`](EditableWrapper.md)

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

[manufacturer](./EditedMold.manufacturer.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Gets the mold manufacturer.

</td></tr>
<tr><td>

[productNumber](./EditedMold.productNumber.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Gets the product number.

</td></tr>
<tr><td>

[format](./EditedMold.format.md)

</td><td>

`readonly`

</td><td>

[MoldFormat](../type-aliases/MoldFormat.md)

</td><td>

Gets the mold format.

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

[create(initial)](./EditedMold.create.md)

</td><td>

`static`

</td><td>

Factory method for creating an EditedMold from an existing entity.

</td></tr>
<tr><td>

[restoreFromHistory(history)](./EditedMold.restoreFromHistory.md)

</td><td>

`static`

</td><td>

Factory method for restoring an EditedMold from serialized history.

</td></tr>
<tr><td>

[setManufacturer(manufacturer)](./EditedMold.setManufacturer.md)

</td><td>



</td><td>

Sets the mold manufacturer.

</td></tr>
<tr><td>

[setProductNumber(productNumber)](./EditedMold.setProductNumber.md)

</td><td>



</td><td>

Sets the product number.

</td></tr>
<tr><td>

[setDescription(description)](./EditedMold.setDescription.md)

</td><td>



</td><td>

Sets the mold description.

</td></tr>
<tr><td>

[setCavities(cavities)](./EditedMold.setCavities.md)

</td><td>



</td><td>

Sets the cavities specification.

</td></tr>
<tr><td>

[setFormat(format)](./EditedMold.setFormat.md)

</td><td>



</td><td>

Sets the mold format.

</td></tr>
<tr><td>

[setTags(tags)](./EditedMold.setTags.md)

</td><td>



</td><td>

Sets the tags list.

</td></tr>
<tr><td>

[setRelated(related)](./EditedMold.setRelated.md)

</td><td>



</td><td>

Sets the related molds list.

</td></tr>
<tr><td>

[setNotes(notes)](./EditedMold.setNotes.md)

</td><td>



</td><td>

Sets the notes list.

</td></tr>
<tr><td>

[setUrls(urls)](./EditedMold.setUrls.md)

</td><td>



</td><td>

Sets the URLs list.

</td></tr>
<tr><td>

[applyUpdate(update)](./EditedMold.applyUpdate.md)

</td><td>



</td><td>

Applies a partial update to the current entity.

</td></tr>
<tr><td>

[hasChanges(original)](./EditedMold.hasChanges.md)

</td><td>



</td><td>

Checks if current state differs from original.

</td></tr>
<tr><td>

[getChanges(original)](./EditedMold.getChanges.md)

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
