[Home](../../../README.md) > [UserLibrary](../../README.md) > [Session](../README.md) > EditingSession

# Class: EditingSession

A mutable editing session for modifying filling recipe variations.

Core architecture:
- Wraps an IRuntimeFillingRecipeVariation (immutable source)
- Uses RuntimeProducedFilling for mutable editing with undo/redo
- Tracks original snapshot for change detection
- Provides save operations that integrate with library

**Implements:** [`IMaterializedSessionBase`](../../../interfaces/IMaterializedSessionBase.md)

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

[sessionId](./EditingSession.sessionId.md)

</td><td>

`readonly`

</td><td>

[SessionSpec](../../../type-aliases/SessionSpec.md)

</td><td>

Unique session identifier.

</td></tr>
<tr><td>

[baseRecipe](./EditingSession.baseRecipe.md)

</td><td>

`readonly`

</td><td>

[IFillingRecipeVariation](../../../interfaces/IFillingRecipeVariation.md)

</td><td>

The base recipe variation being edited.

</td></tr>
<tr><td>

[produced](./EditingSession.produced.md)

</td><td>

`readonly`

</td><td>

[ProducedFilling](../../../classes/ProducedFilling.md)

</td><td>

The produced filling wrapper with undo/redo support.

</td></tr>
<tr><td>

[targetWeight](./EditingSession.targetWeight.md)

</td><td>

`readonly`

</td><td>

[Measurement](../../../type-aliases/Measurement.md)

</td><td>

Current target weight for this filling.

</td></tr>
<tr><td>

[hasChanges](./EditingSession.hasChanges.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether the session has unsaved changes.

</td></tr>
<tr><td>

[baseId](./EditingSession.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseSessionId](../../../type-aliases/BaseSessionId.md)

</td><td>

Base identifier within the collection (no collection prefix).

</td></tr>
<tr><td>

[sessionType](./EditingSession.sessionType.md)

</td><td>

`readonly`

</td><td>

"filling"

</td><td>

Session type discriminator - always 'filling' for EditingSession.

</td></tr>
<tr><td>

[status](./EditingSession.status.md)

</td><td>

`readonly`

</td><td>

[PersistedSessionStatus](../../../type-aliases/PersistedSessionStatus.md)

</td><td>

Current lifecycle status.

</td></tr>
<tr><td>

[label](./EditingSession.label.md)

</td><td>

`readonly`

</td><td>

string | undefined

</td><td>

User-provided label for the session.

</td></tr>
<tr><td>

[group](./EditingSession.group.md)

</td><td>

`readonly`

</td><td>

[GroupName](../../../type-aliases/GroupName.md) | undefined

</td><td>

Optional group identifier for organizing related sessions.

</td></tr>
<tr><td>

[createdAt](./EditingSession.createdAt.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

ISO 8601 timestamp when session was created.

</td></tr>
<tr><td>

[updatedAt](./EditingSession.updatedAt.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

ISO 8601 timestamp when session was last updated.

</td></tr>
<tr><td>

[notes](./EditingSession.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../../interfaces/ICategorizedNote.md)[] | undefined

</td><td>

Optional categorized notes.

</td></tr>
<tr><td>

[sourceVariationId](./EditingSession.sourceVariationId.md)

</td><td>

`readonly`

</td><td>

[FillingRecipeVariationId](../../../type-aliases/FillingRecipeVariationId.md)

</td><td>

Source filling variation ID for this session.

</td></tr>
<tr><td>

[entity](./EditingSession.entity.md)

</td><td>

`readonly`

</td><td>

[IFillingSessionEntity](../../../interfaces/IFillingSessionEntity.md)

</td><td>

The underlying persisted entity.

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

[create(baseRecipe, initialScale)](./EditingSession.create.md)

</td><td>

`static`

</td><td>

Creates a new EditingSession from a base recipe variation.

</td></tr>
<tr><td>

[fromPersistedState(data, baseRecipe)](./EditingSession.fromPersistedState.md)

</td><td>

`static`

</td><td>

Restores an editing session from a persisted state.

</td></tr>
<tr><td>

[setIngredient(id, amount, unit, modifiers)](./EditingSession.setIngredient.md)

</td><td>



</td><td>

Sets or updates an ingredient in the filling.

</td></tr>
<tr><td>

[replaceIngredient(oldId, newId, amount, unit, modifiers)](./EditingSession.replaceIngredient.md)

</td><td>



</td><td>

Replaces an existing ingredient with a new one at the same position.

</td></tr>
<tr><td>

[removeIngredient(id)](./EditingSession.removeIngredient.md)

</td><td>



</td><td>

Removes an ingredient from the filling.

</td></tr>
<tr><td>

[scaleToTargetWeight(targetWeight)](./EditingSession.scaleToTargetWeight.md)

</td><td>



</td><td>

Scales the filling to achieve a target weight.

</td></tr>
<tr><td>

[setNotes(notes)](./EditingSession.setNotes.md)

</td><td>



</td><td>

Sets the notes for the filling.

</td></tr>
<tr><td>

[setProcedure(id)](./EditingSession.setProcedure.md)

</td><td>



</td><td>

Sets the procedure for the filling.

</td></tr>
<tr><td>

[undo()](./EditingSession.undo.md)

</td><td>



</td><td>

Undoes the last change.

</td></tr>
<tr><td>

[redo()](./EditingSession.redo.md)

</td><td>



</td><td>

Redoes the last undone change.

</td></tr>
<tr><td>

[canUndo()](./EditingSession.canUndo.md)

</td><td>



</td><td>

Checks if undo is available.

</td></tr>
<tr><td>

[canRedo()](./EditingSession.canRedo.md)

</td><td>



</td><td>

Checks if redo is available.

</td></tr>
<tr><td>

[analyzeSaveOptions()](./EditingSession.analyzeSaveOptions.md)

</td><td>



</td><td>

Analyzes current changes and recommends save options.

</td></tr>
<tr><td>

[saveAsNewVariation(options)](./EditingSession.saveAsNewVariation.md)

</td><td>



</td><td>

Saves as a new variation of the original recipe.

</td></tr>
<tr><td>

[saveAsAlternatives(options)](./EditingSession.saveAsAlternatives.md)

</td><td>



</td><td>

Saves by adding ingredients as alternatives to existing variation.

</td></tr>
<tr><td>

[saveAsNewRecipe(options)](./EditingSession.saveAsNewRecipe.md)

</td><td>



</td><td>

Saves as an entirely new recipe with new ID.

</td></tr>
<tr><td>

[toEditJournalEntry(notes)](./EditingSession.toEditJournalEntry.md)

</td><td>



</td><td>

Creates an edit journal entry from this session.

</td></tr>
<tr><td>

[toProductionJournalEntry(notes)](./EditingSession.toProductionJournalEntry.md)

</td><td>



</td><td>

Creates a production journal entry from this session.

</td></tr>
<tr><td>

[toPersistedState(options)](./EditingSession.toPersistedState.md)

</td><td>



</td><td>

Creates a persisted session state from this editing session.

</td></tr>
<tr><td>

[markSaved()](./EditingSession.markSaved.md)

</td><td>



</td><td>

Resets the change-detection baseline to the current produced state.

</td></tr>
</tbody></table>
