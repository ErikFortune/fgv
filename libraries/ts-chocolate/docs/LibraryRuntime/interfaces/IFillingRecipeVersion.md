[Home](../../README.md) > [LibraryRuntime](../README.md) > IFillingRecipeVersion

# Interface: IFillingRecipeVersion

A resolved runtime view of a recipe version with resolved ingredients.

This interface provides runtime-layer access to version data with:
- Parent recipe reference (both ID and resolved object)
- Resolved ingredient access via flexible filtering
- Ganache calculation

Note: Does not directly extend `IFillingRecipeVersionEntity` because `ingredients` has a different
type (resolved vs entity references).

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

[versionId](./IFillingRecipeVersion.versionId.md)

</td><td>

`readonly`

</td><td>

[FillingRecipeVariationId](../../type-aliases/FillingRecipeVariationId.md)

</td><td>

Qualified identifier for this version (recipeId@versionSpec).

</td></tr>
<tr><td>

[versionSpec](./IFillingRecipeVersion.versionSpec.md)

</td><td>

`readonly`

</td><td>

[FillingRecipeVariationSpec](../../type-aliases/FillingRecipeVariationSpec.md)

</td><td>

Version spec portion of the identifier.

</td></tr>
<tr><td>

[createdDate](./IFillingRecipeVersion.createdDate.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Date this version was created (ISO 8601 format).

</td></tr>
<tr><td>

[fillingId](./IFillingRecipeVersion.fillingId.md)

</td><td>

`readonly`

</td><td>

[FillingId](../../type-aliases/FillingId.md)

</td><td>

The parent filling ID.

</td></tr>
<tr><td>

[fillingRecipe](./IFillingRecipeVersion.fillingRecipe.md)

</td><td>

`readonly`

</td><td>

[IFillingRecipe](../../interfaces/IFillingRecipe.md)

</td><td>

The parent filling recipe - resolved.

</td></tr>
<tr><td>

[version](./IFillingRecipeVersion.version.md)

</td><td>

`readonly`

</td><td>

[IFillingRecipeVersionEntity](../../interfaces/IFillingRecipeVersionEntity.md)

</td><td>

The underlying filling recipe version.

</td></tr>
<tr><td>

[baseWeight](./IFillingRecipeVersion.baseWeight.md)

</td><td>

`readonly`

</td><td>

[Measurement](../../type-aliases/Measurement.md)

</td><td>

Base weight of the recipe (sum of all ingredient amounts).

</td></tr>
<tr><td>

[yield](./IFillingRecipeVersion.yield.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional yield description (e.g., "50 bonbons").

</td></tr>
<tr><td>

[notes](./IFillingRecipeVersion.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[]

</td><td>

Optional notes about this version.

</td></tr>
<tr><td>

[ratings](./IFillingRecipeVersion.ratings.md)

</td><td>

`readonly`

</td><td>

readonly [IFillingRating](../../interfaces/IFillingRating.md)[]

</td><td>

Optional ratings for this version.

</td></tr>
<tr><td>

[procedures](./IFillingRecipeVersion.procedures.md)

</td><td>

`readonly`

</td><td>

[IResolvedProcedures](../../interfaces/IResolvedProcedures.md)

</td><td>

Resolved procedures associated with this version.

</td></tr>
<tr><td>

[preferredProcedure](./IFillingRecipeVersion.preferredProcedure.md)

</td><td>

`readonly`

</td><td>

[IResolvedFillingRecipeProcedure](../../interfaces/IResolvedFillingRecipeProcedure.md) | undefined

</td><td>

Gets the preferred procedure, falling back to first available.

</td></tr>
<tr><td>

[entity](./IFillingRecipeVersion.entity.md)

</td><td>

`readonly`

</td><td>

[IFillingRecipeVersionEntity](../../interfaces/IFillingRecipeVersionEntity.md)

</td><td>

Gets the underlying entity version data.

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

[getIngredients(filter)](./IFillingRecipeVersion.getIngredients.md)

</td><td>



</td><td>

Gets ingredients, optionally filtered.

</td></tr>
<tr><td>

[usesIngredient(ingredientId)](./IFillingRecipeVersion.usesIngredient.md)

</td><td>



</td><td>

Checks if this version uses a specific ingredient (as primary).

</td></tr>
<tr><td>

[calculateGanache()](./IFillingRecipeVersion.calculateGanache.md)

</td><td>



</td><td>

Calculates ganache characteristics for this version.

</td></tr>
</tbody></table>
