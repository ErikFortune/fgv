[Home](../README.md) > FillingRecipeVersion

# Class: FillingRecipeVersion

A resolved view of a recipe variation with all ingredients resolved.

**Implements:** [`IFillingRecipeVariation`](../interfaces/IFillingRecipeVariation.md)

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

[variationId](./FillingRecipeVersion.variationId.md)

</td><td>

`readonly`

</td><td>

[FillingRecipeVariationId](../type-aliases/FillingRecipeVariationId.md)

</td><td>

Qualified identifier for this variation (fillingId@variationSpec).

</td></tr>
<tr><td>

[variationSpec](./FillingRecipeVersion.variationSpec.md)

</td><td>

`readonly`

</td><td>

[FillingRecipeVariationSpec](../type-aliases/FillingRecipeVariationSpec.md)

</td><td>

The variation specifier

</td></tr>
<tr><td>

[createdDate](./FillingRecipeVersion.createdDate.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Date this variation was created (ISO 8601 format)

</td></tr>
<tr><td>

[fillingId](./FillingRecipeVersion.fillingId.md)

</td><td>

`readonly`

</td><td>

[FillingId](../type-aliases/FillingId.md)

</td><td>

The parent filling ID

</td></tr>
<tr><td>

[fillingRecipe](./FillingRecipeVersion.fillingRecipe.md)

</td><td>

`readonly`

</td><td>

[IFillingRecipe](../interfaces/IFillingRecipe.md)

</td><td>

The parent filling recipe - resolved.

</td></tr>
<tr><td>

[baseWeight](./FillingRecipeVersion.baseWeight.md)

</td><td>

`readonly`

</td><td>

[Measurement](../type-aliases/Measurement.md)

</td><td>

Base weight of the recipe (sum of all ingredient amounts)

</td></tr>
<tr><td>

[yield](./FillingRecipeVersion.yield.md)

</td><td>

`readonly`

</td><td>

string | undefined

</td><td>

Optional yield description (e.g., "50 bonbons")

</td></tr>
<tr><td>

[notes](./FillingRecipeVersion.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../interfaces/ICategorizedNote.md)[] | undefined

</td><td>

Optional categorized notes about this variation

</td></tr>
<tr><td>

[ratings](./FillingRecipeVersion.ratings.md)

</td><td>

`readonly`

</td><td>

readonly [IFillingRating](../interfaces/IFillingRating.md)[]

</td><td>

Optional ratings for this variation

</td></tr>
<tr><td>

[procedures](./FillingRecipeVersion.procedures.md)

</td><td>

`readonly`

</td><td>

[IResolvedProcedures](../interfaces/IResolvedProcedures.md) | undefined

</td><td>

Resolved procedures associated with this variation.

</td></tr>
<tr><td>

[preferredProcedure](./FillingRecipeVersion.preferredProcedure.md)

</td><td>

`readonly`

</td><td>

[IResolvedFillingRecipeProcedure](../interfaces/IResolvedFillingRecipeProcedure.md) | undefined

</td><td>

Gets the preferred procedure, falling back to first available.

</td></tr>
<tr><td>

[entity](./FillingRecipeVersion.entity.md)

</td><td>

`readonly`

</td><td>

[IFillingRecipeVariationEntity](../interfaces/IFillingRecipeVariationEntity.md)

</td><td>

Gets the underlying variation entity data

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

[create(context, fillingId, variation)](./FillingRecipeVersion.create.md)

</td><td>

`static`

</td><td>

Factory method for creating a LibraryRuntime.RuntimeFillingRecipeVariation.

</td></tr>
<tr><td>

[getIngredients(filter)](./FillingRecipeVersion.getIngredients.md)

</td><td>



</td><td>

Gets ingredients, optionally filtered.

</td></tr>
<tr><td>

[usesIngredient(ingredientId)](./FillingRecipeVersion.usesIngredient.md)

</td><td>



</td><td>

Checks if this variation uses a specific ingredient (as primary).

</td></tr>
<tr><td>

[calculateGanache()](./FillingRecipeVersion.calculateGanache.md)

</td><td>



</td><td>

Calculates ganache characteristics for this variation.

</td></tr>
<tr><td>

[getProcedures()](./FillingRecipeVersion.getProcedures.md)

</td><td>



</td><td>

Gets resolved procedures associated with this variation.

</td></tr>
</tbody></table>
