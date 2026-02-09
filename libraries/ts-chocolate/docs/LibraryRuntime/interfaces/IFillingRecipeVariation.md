[Home](../../README.md) > [LibraryRuntime](../README.md) > IFillingRecipeVariation

# Interface: IFillingRecipeVariation

A resolved runtime view of a recipe variation with resolved ingredients.

This interface provides runtime-layer access to variation data with:
- Parent recipe reference (both ID and resolved object)
- Resolved ingredient access via flexible filtering
- Ganache calculation

Note: Does not directly extend `IFillingRecipeVariationEntity` because `ingredients` has a different
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

[variationId](./IFillingRecipeVariation.variationId.md)

</td><td>

`readonly`

</td><td>

[FillingRecipeVariationId](../../type-aliases/FillingRecipeVariationId.md)

</td><td>

Qualified identifier for this variation (recipeId@variationSpec).

</td></tr>
<tr><td>

[variationSpec](./IFillingRecipeVariation.variationSpec.md)

</td><td>

`readonly`

</td><td>

[FillingRecipeVariationSpec](../../type-aliases/FillingRecipeVariationSpec.md)

</td><td>

Variation spec portion of the identifier.

</td></tr>
<tr><td>

[createdDate](./IFillingRecipeVariation.createdDate.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Date this variation was created (ISO 8601 format).

</td></tr>
<tr><td>

[fillingId](./IFillingRecipeVariation.fillingId.md)

</td><td>

`readonly`

</td><td>

[FillingId](../../type-aliases/FillingId.md)

</td><td>

The parent filling ID.

</td></tr>
<tr><td>

[fillingRecipe](./IFillingRecipeVariation.fillingRecipe.md)

</td><td>

`readonly`

</td><td>

[IFillingRecipe](../../interfaces/IFillingRecipe.md)

</td><td>

The parent filling recipe - resolved.

</td></tr>
<tr><td>

[isMutable](./IFillingRecipeVariation.isMutable.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether this variation's parent collection is mutable.

</td></tr>
<tr><td>

[baseWeight](./IFillingRecipeVariation.baseWeight.md)

</td><td>

`readonly`

</td><td>

[Measurement](../../type-aliases/Measurement.md)

</td><td>

Base weight of the recipe (sum of all ingredient amounts).

</td></tr>
<tr><td>

[yield](./IFillingRecipeVariation.yield.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional yield description (e.g., "50 bonbons").

</td></tr>
<tr><td>

[notes](./IFillingRecipeVariation.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[]

</td><td>

Optional notes about this variation.

</td></tr>
<tr><td>

[ratings](./IFillingRecipeVariation.ratings.md)

</td><td>

`readonly`

</td><td>

readonly [IFillingRating](../../interfaces/IFillingRating.md)[]

</td><td>

Optional ratings for this variation.

</td></tr>
<tr><td>

[procedures](./IFillingRecipeVariation.procedures.md)

</td><td>

`readonly`

</td><td>

[IResolvedProcedures](../../interfaces/IResolvedProcedures.md)

</td><td>

Resolved procedures associated with this variation.

</td></tr>
<tr><td>

[preferredProcedure](./IFillingRecipeVariation.preferredProcedure.md)

</td><td>

`readonly`

</td><td>

[IResolvedFillingRecipeProcedure](../../interfaces/IResolvedFillingRecipeProcedure.md) | undefined

</td><td>

Gets the preferred procedure, falling back to first available.

</td></tr>
<tr><td>

[entity](./IFillingRecipeVariation.entity.md)

</td><td>

`readonly`

</td><td>

[IFillingRecipeVariationEntity](../../interfaces/IFillingRecipeVariationEntity.md)

</td><td>

Gets the underlying entity variation data.

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

[getIngredients(filter)](./IFillingRecipeVariation.getIngredients.md)

</td><td>



</td><td>

Gets ingredients, optionally filtered.

</td></tr>
<tr><td>

[usesIngredient(ingredientId)](./IFillingRecipeVariation.usesIngredient.md)

</td><td>



</td><td>

Checks if this variation uses a specific ingredient (as primary).

</td></tr>
<tr><td>

[calculateGanache()](./IFillingRecipeVariation.calculateGanache.md)

</td><td>



</td><td>

Calculates ganache characteristics for this variation.

</td></tr>
</tbody></table>
