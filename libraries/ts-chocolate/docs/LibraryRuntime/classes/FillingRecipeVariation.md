[Home](../../README.md) > [LibraryRuntime](../README.md) > FillingRecipeVariation

# Class: FillingRecipeVariation

A resolved view of a recipe variation with all ingredients resolved.

**Implements:** [`IFillingRecipeVariation`](../../interfaces/IFillingRecipeVariation.md)

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

[variationId](./FillingRecipeVariation.variationId.md)

</td><td>

`readonly`

</td><td>

[FillingRecipeVariationId](../../type-aliases/FillingRecipeVariationId.md)

</td><td>

Qualified identifier for this variation (fillingId@variationSpec).

</td></tr>
<tr><td>

[variationSpec](./FillingRecipeVariation.variationSpec.md)

</td><td>

`readonly`

</td><td>

[FillingRecipeVariationSpec](../../type-aliases/FillingRecipeVariationSpec.md)

</td><td>

The variation specifier

</td></tr>
<tr><td>

[name](./FillingRecipeVariation.name.md)

</td><td>

`readonly`

</td><td>

string | undefined

</td><td>

Optional human-readable name for this variation.

</td></tr>
<tr><td>

[createdDate](./FillingRecipeVariation.createdDate.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Date this variation was created (ISO 8601 format)

</td></tr>
<tr><td>

[fillingId](./FillingRecipeVariation.fillingId.md)

</td><td>

`readonly`

</td><td>

[FillingId](../../type-aliases/FillingId.md)

</td><td>

The parent filling ID

</td></tr>
<tr><td>

[fillingRecipe](./FillingRecipeVariation.fillingRecipe.md)

</td><td>

`readonly`

</td><td>

[IFillingRecipe](../../interfaces/IFillingRecipe.md)

</td><td>

The parent filling recipe - resolved.

</td></tr>
<tr><td>

[isMutable](./FillingRecipeVariation.isMutable.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether this variation's parent collection is mutable.

</td></tr>
<tr><td>

[baseWeight](./FillingRecipeVariation.baseWeight.md)

</td><td>

`readonly`

</td><td>

[Measurement](../../type-aliases/Measurement.md)

</td><td>

Base weight of the recipe (sum of all ingredient amounts)

</td></tr>
<tr><td>

[yield](./FillingRecipeVariation.yield.md)

</td><td>

`readonly`

</td><td>

string | undefined

</td><td>

Optional yield description (e.g., "50 bonbons")

</td></tr>
<tr><td>

[notes](./FillingRecipeVariation.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[] | undefined

</td><td>

Optional categorized notes about this variation

</td></tr>
<tr><td>

[ratings](./FillingRecipeVariation.ratings.md)

</td><td>

`readonly`

</td><td>

readonly [IFillingRating](../../interfaces/IFillingRating.md)[]

</td><td>

Optional ratings for this variation

</td></tr>
<tr><td>

[procedures](./FillingRecipeVariation.procedures.md)

</td><td>

`readonly`

</td><td>

[IResolvedProcedures](../../interfaces/IResolvedProcedures.md) | undefined

</td><td>

Resolved procedures associated with this variation.

</td></tr>
<tr><td>

[preferredProcedure](./FillingRecipeVariation.preferredProcedure.md)

</td><td>

`readonly`

</td><td>

[IResolvedFillingRecipeProcedure](../../interfaces/IResolvedFillingRecipeProcedure.md) | undefined

</td><td>

Gets the preferred procedure, falling back to first available.

</td></tr>
<tr><td>

[entity](./FillingRecipeVariation.entity.md)

</td><td>

`readonly`

</td><td>

[IFillingRecipeVariationEntity](../../interfaces/IFillingRecipeVariationEntity.md)

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

[create(context, fillingId, variation)](./FillingRecipeVariation.create.md)

</td><td>

`static`

</td><td>

Factory method for creating a LibraryRuntime.RuntimeFillingRecipeVariation.

</td></tr>
<tr><td>

[getIngredients(filter)](./FillingRecipeVariation.getIngredients.md)

</td><td>



</td><td>

Gets ingredients, optionally filtered.

</td></tr>
<tr><td>

[usesIngredient(ingredientId)](./FillingRecipeVariation.usesIngredient.md)

</td><td>



</td><td>

Checks if this variation uses a specific ingredient (as primary).

</td></tr>
<tr><td>

[calculateGanache()](./FillingRecipeVariation.calculateGanache.md)

</td><td>



</td><td>

Calculates ganache characteristics for this variation.

</td></tr>
<tr><td>

[getProcedures()](./FillingRecipeVariation.getProcedures.md)

</td><td>



</td><td>

Gets resolved procedures associated with this variation.

</td></tr>
</tbody></table>
