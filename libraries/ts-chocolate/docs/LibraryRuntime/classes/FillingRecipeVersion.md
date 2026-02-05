[Home](../../README.md) > [LibraryRuntime](../README.md) > FillingRecipeVersion

# Class: FillingRecipeVersion

A resolved view of a recipe version with all ingredients resolved.

**Implements:** [`IFillingRecipeVersion`](../../interfaces/IFillingRecipeVersion.md)

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

[versionId](./FillingRecipeVersion.versionId.md)

</td><td>

`readonly`

</td><td>

[FillingRecipeVariationId](../../type-aliases/FillingRecipeVariationId.md)

</td><td>

Qualified identifier for this version (fillingId@versionSpec).

</td></tr>
<tr><td>

[versionSpec](./FillingRecipeVersion.versionSpec.md)

</td><td>

`readonly`

</td><td>

[FillingRecipeVariationSpec](../../type-aliases/FillingRecipeVariationSpec.md)

</td><td>

The version specifier

</td></tr>
<tr><td>

[createdDate](./FillingRecipeVersion.createdDate.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Date this version was created (ISO 8601 format)

</td></tr>
<tr><td>

[fillingId](./FillingRecipeVersion.fillingId.md)

</td><td>

`readonly`

</td><td>

[FillingId](../../type-aliases/FillingId.md)

</td><td>

The parent filling ID

</td></tr>
<tr><td>

[fillingRecipe](./FillingRecipeVersion.fillingRecipe.md)

</td><td>

`readonly`

</td><td>

[IFillingRecipe](../../interfaces/IFillingRecipe.md)

</td><td>

The parent filling recipe - resolved.

</td></tr>
<tr><td>

[version](./FillingRecipeVersion.version.md)

</td><td>

`readonly`

</td><td>

[IFillingRecipeVersionEntity](../../interfaces/IFillingRecipeVersionEntity.md)

</td><td>

The underlying filling recipe version.

</td></tr>
<tr><td>

[baseWeight](./FillingRecipeVersion.baseWeight.md)

</td><td>

`readonly`

</td><td>

[Measurement](../../type-aliases/Measurement.md)

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

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[] | undefined

</td><td>

Optional categorized notes about this version

</td></tr>
<tr><td>

[ratings](./FillingRecipeVersion.ratings.md)

</td><td>

`readonly`

</td><td>

readonly [IFillingRating](../../interfaces/IFillingRating.md)[]

</td><td>

Optional ratings for this version

</td></tr>
<tr><td>

[procedures](./FillingRecipeVersion.procedures.md)

</td><td>

`readonly`

</td><td>

[IResolvedProcedures](../../interfaces/IResolvedProcedures.md) | undefined

</td><td>

Resolved procedures associated with this version.

</td></tr>
<tr><td>

[preferredProcedure](./FillingRecipeVersion.preferredProcedure.md)

</td><td>

`readonly`

</td><td>

[IResolvedFillingRecipeProcedure](../../interfaces/IResolvedFillingRecipeProcedure.md) | undefined

</td><td>

Gets the preferred procedure, falling back to first available.

</td></tr>
<tr><td>

[entity](./FillingRecipeVersion.entity.md)

</td><td>

`readonly`

</td><td>

[IFillingRecipeVersionEntity](../../interfaces/IFillingRecipeVersionEntity.md)

</td><td>

Gets the underlying version entity data

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

[create(context, fillingId, version)](./FillingRecipeVersion.create.md)

</td><td>

`static`

</td><td>

Factory method for creating a RuntimeFillingRecipeVersion.

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

Checks if this version uses a specific ingredient (as primary).

</td></tr>
<tr><td>

[calculateGanache()](./FillingRecipeVersion.calculateGanache.md)

</td><td>



</td><td>

Calculates ganache characteristics for this version.

</td></tr>
<tr><td>

[getProcedures()](./FillingRecipeVersion.getProcedures.md)

</td><td>



</td><td>

Gets resolved procedures associated with this version.

</td></tr>
</tbody></table>
