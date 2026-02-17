[Home](../README.md) > EditedFillingRecipe

# Class: EditedFillingRecipe

Mutable wrapper for IFillingRecipeEntity with undo/redo support.
Manages recipe-level fields only (name, category, description, tags, urls, goldenVariationSpec).
Variation-level editing (ingredients, procedures, ratings, scaling) is handled by EditingSession.
After an EditingSession save produces a variationEntity, use replaceVariation() or addVariation()
to integrate it back into this wrapper.

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

[snapshot](./EditedFillingRecipe.snapshot.md)

</td><td>

`readonly`

</td><td>

[IFillingRecipeEntity](../interfaces/IFillingRecipeEntity.md)

</td><td>

Gets the current state as an immutable snapshot.

</td></tr>
<tr><td>

[current](./EditedFillingRecipe.current.md)

</td><td>

`readonly`

</td><td>

[IFillingRecipeEntity](../interfaces/IFillingRecipeEntity.md)

</td><td>

Gets the current entity (direct reference - callers should not mutate).

</td></tr>
<tr><td>

[name](./EditedFillingRecipe.name.md)

</td><td>

`readonly`

</td><td>

[FillingName](../type-aliases/FillingName.md)

</td><td>

Gets the filling recipe name.

</td></tr>
<tr><td>

[goldenVariationSpec](./EditedFillingRecipe.goldenVariationSpec.md)

</td><td>

`readonly`

</td><td>

[FillingRecipeVariationSpec](../type-aliases/FillingRecipeVariationSpec.md)

</td><td>

Gets the golden variation spec.

</td></tr>
<tr><td>

[variations](./EditedFillingRecipe.variations.md)

</td><td>

`readonly`

</td><td>

readonly [IFillingRecipeVariationEntity](../interfaces/IFillingRecipeVariationEntity.md)[]

</td><td>

Gets the variations array.

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

[create(initial)](./EditedFillingRecipe.create.md)

</td><td>

`static`

</td><td>

Factory method for creating an EditedFillingRecipe from an existing entity.

</td></tr>
<tr><td>

[restoreFromHistory(history)](./EditedFillingRecipe.restoreFromHistory.md)

</td><td>

`static`

</td><td>

Factory method for restoring an EditedFillingRecipe from serialized history.

</td></tr>
<tr><td>

[createSnapshot()](./EditedFillingRecipe.createSnapshot.md)

</td><td>



</td><td>

Creates an immutable snapshot of the current state.

</td></tr>
<tr><td>

[restoreSnapshot(snapshot)](./EditedFillingRecipe.restoreSnapshot.md)

</td><td>



</td><td>

Restores state from a snapshot.

</td></tr>
<tr><td>

[getSerializedHistory(original)](./EditedFillingRecipe.getSerializedHistory.md)

</td><td>



</td><td>

Serializes the complete editing history for persistence.

</td></tr>
<tr><td>

[undo()](./EditedFillingRecipe.undo.md)

</td><td>



</td><td>

Undoes the last change.

</td></tr>
<tr><td>

[redo()](./EditedFillingRecipe.redo.md)

</td><td>



</td><td>

Redoes the last undone change.

</td></tr>
<tr><td>

[canUndo()](./EditedFillingRecipe.canUndo.md)

</td><td>



</td><td>

Checks if undo is available.

</td></tr>
<tr><td>

[canRedo()](./EditedFillingRecipe.canRedo.md)

</td><td>



</td><td>

Checks if redo is available.

</td></tr>
<tr><td>

[setName(name)](./EditedFillingRecipe.setName.md)

</td><td>



</td><td>

Sets the filling recipe name.

</td></tr>
<tr><td>

[setCategory(category)](./EditedFillingRecipe.setCategory.md)

</td><td>



</td><td>

Sets the filling recipe category.

</td></tr>
<tr><td>

[setDescription(description)](./EditedFillingRecipe.setDescription.md)

</td><td>



</td><td>

Sets the filling recipe description.

</td></tr>
<tr><td>

[setTags(tags)](./EditedFillingRecipe.setTags.md)

</td><td>



</td><td>

Sets the tags list.

</td></tr>
<tr><td>

[setUrls(urls)](./EditedFillingRecipe.setUrls.md)

</td><td>



</td><td>

Sets the URLs list.

</td></tr>
<tr><td>

[setGoldenVariationSpec(spec)](./EditedFillingRecipe.setGoldenVariationSpec.md)

</td><td>



</td><td>

Sets the golden variation spec.

</td></tr>
<tr><td>

[replaceVariation(spec, variation)](./EditedFillingRecipe.replaceVariation.md)

</td><td>



</td><td>

Replaces a variation's entity data (called after EditingSession save).

</td></tr>
<tr><td>

[addVariation(variation)](./EditedFillingRecipe.addVariation.md)

</td><td>



</td><td>

Adds a new variation entity (from EditingSession saveAsNewVariation).

</td></tr>
<tr><td>

[removeVariation(spec)](./EditedFillingRecipe.removeVariation.md)

</td><td>



</td><td>

Removes a variation from the recipe.

</td></tr>
<tr><td>

[hasChanges(original)](./EditedFillingRecipe.hasChanges.md)

</td><td>



</td><td>

Checks if current state differs from original.

</td></tr>
<tr><td>

[getChanges(original)](./EditedFillingRecipe.getChanges.md)

</td><td>



</td><td>

Gets detailed changes between current state and original.

</td></tr>
</tbody></table>
