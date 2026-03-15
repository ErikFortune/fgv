[Home](../README.md) > EditedConfectionRecipe

# Class: EditedConfectionRecipe

Mutable wrapper for AnyConfectionRecipeEntity with undo/redo support.
Manages recipe-level fields only (name, description, tags, urls, goldenVariationSpec).
Variation-level editing (fillings, procedures, scaling) is handled by ConfectionEditingSession.
After a ConfectionEditingSession save produces a variationEntity, use replaceVariation() or addVariation()
to integrate it back into this wrapper.

**Extends:** [`EditableWrapper<AnyConfectionRecipeEntity>`](EditableWrapper.md)

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

[name](./EditedConfectionRecipe.name.md)

</td><td>

`readonly`

</td><td>

[ConfectionName](../type-aliases/ConfectionName.md)

</td><td>

Gets the confection recipe name.

</td></tr>
<tr><td>

[confectionType](./EditedConfectionRecipe.confectionType.md)

</td><td>

`readonly`

</td><td>

[ConfectionType](../type-aliases/ConfectionType.md)

</td><td>

Gets the confection type.

</td></tr>
<tr><td>

[goldenVariationSpec](./EditedConfectionRecipe.goldenVariationSpec.md)

</td><td>

`readonly`

</td><td>

[ConfectionRecipeVariationSpec](../type-aliases/ConfectionRecipeVariationSpec.md)

</td><td>

Gets the golden variation spec.

</td></tr>
<tr><td>

[variations](./EditedConfectionRecipe.variations.md)

</td><td>

`readonly`

</td><td>

readonly [AnyConfectionRecipeVariationEntity](../type-aliases/AnyConfectionRecipeVariationEntity.md)[]

</td><td>

Gets the variations array.

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

[create(initial)](./EditedConfectionRecipe.create.md)

</td><td>

`static`

</td><td>

Factory method for creating an EditedConfectionRecipe from an existing entity.

</td></tr>
<tr><td>

[restoreFromHistory(history)](./EditedConfectionRecipe.restoreFromHistory.md)

</td><td>

`static`

</td><td>

Factory method for restoring an EditedConfectionRecipe from serialized history.

</td></tr>
<tr><td>

[setName(name)](./EditedConfectionRecipe.setName.md)

</td><td>



</td><td>

Sets the confection recipe name.

</td></tr>
<tr><td>

[setDescription(description)](./EditedConfectionRecipe.setDescription.md)

</td><td>



</td><td>

Sets the confection recipe description.

</td></tr>
<tr><td>

[setTags(tags)](./EditedConfectionRecipe.setTags.md)

</td><td>



</td><td>

Sets the tags list.

</td></tr>
<tr><td>

[setUrls(urls)](./EditedConfectionRecipe.setUrls.md)

</td><td>



</td><td>

Sets the URLs list.

</td></tr>
<tr><td>

[setGoldenVariationSpec(spec)](./EditedConfectionRecipe.setGoldenVariationSpec.md)

</td><td>



</td><td>

Sets the golden variation spec.

</td></tr>
<tr><td>

[addVariation(variation)](./EditedConfectionRecipe.addVariation.md)

</td><td>



</td><td>

Adds a new variation entity.

</td></tr>
<tr><td>

[replaceVariation(spec, variation)](./EditedConfectionRecipe.replaceVariation.md)

</td><td>



</td><td>

Replaces a variation's entity data (called after ConfectionEditingSession save).

</td></tr>
<tr><td>

[removeVariation(spec)](./EditedConfectionRecipe.removeVariation.md)

</td><td>



</td><td>

Removes a variation from the recipe.

</td></tr>
<tr><td>

[setVariationName(spec, name)](./EditedConfectionRecipe.setVariationName.md)

</td><td>



</td><td>

Sets or clears the display name on a variation.

</td></tr>
<tr><td>

[createBlankVariation(options)](./EditedConfectionRecipe.createBlankVariation.md)

</td><td>



</td><td>

Creates a new blank variation and adds it to the recipe.

</td></tr>
<tr><td>

[duplicateVariation(sourceSpec, options)](./EditedConfectionRecipe.duplicateVariation.md)

</td><td>



</td><td>

Duplicates an existing variation, creating a new one with a unique spec.

</td></tr>
<tr><td>

[setVariationYield(spec, yieldSpec)](./EditedConfectionRecipe.setVariationYield.md)

</td><td>



</td><td>

Sets the yield specification on a variation.

</td></tr>
<tr><td>

[setVariationFillings(spec, fillings)](./EditedConfectionRecipe.setVariationFillings.md)

</td><td>



</td><td>

Sets the filling slots on a variation.

</td></tr>
<tr><td>

[setVariationMolds(spec, molds)](./EditedConfectionRecipe.setVariationMolds.md)

</td><td>



</td><td>

Sets the molds specification on a molded bon-bon variation.

</td></tr>
<tr><td>

[setVariationShellChocolate(spec, shellChocolate)](./EditedConfectionRecipe.setVariationShellChocolate.md)

</td><td>



</td><td>

Sets the shell chocolate specification on a molded bon-bon variation.

</td></tr>
<tr><td>

[setVariationAdditionalChocolates(spec, additionalChocolates)](./EditedConfectionRecipe.setVariationAdditionalChocolates.md)

</td><td>



</td><td>

Sets the additional chocolates (seal, decoration) on a molded bon-bon variation.

</td></tr>
<tr><td>

[setVariationDecorations(spec, decorations)](./EditedConfectionRecipe.setVariationDecorations.md)

</td><td>



</td><td>

Sets the decorations on a variation.

</td></tr>
<tr><td>

[setVariationCoatings(spec, coatings)](./EditedConfectionRecipe.setVariationCoatings.md)

</td><td>



</td><td>

Sets the coatings specification on a rolled truffle variation.

</td></tr>
<tr><td>

[setVariationEnrobingChocolate(spec, enrobingChocolate)](./EditedConfectionRecipe.setVariationEnrobingChocolate.md)

</td><td>



</td><td>

Sets the enrobing chocolate specification on a rolled truffle or bar truffle variation.

</td></tr>
<tr><td>

[setVariationProcedures(spec, procedures)](./EditedConfectionRecipe.setVariationProcedures.md)

</td><td>



</td><td>

Sets the procedures on a variation.

</td></tr>
<tr><td>

[setVariationNotes(spec, notes)](./EditedConfectionRecipe.setVariationNotes.md)

</td><td>



</td><td>

Sets the notes on a variation.

</td></tr>
<tr><td>

[hasChanges(original)](./EditedConfectionRecipe.hasChanges.md)

</td><td>



</td><td>

Checks if current state differs from original.

</td></tr>
<tr><td>

[getChanges(original)](./EditedConfectionRecipe.getChanges.md)

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
