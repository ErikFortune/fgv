[Home](../../README.md) > [Entities](../README.md) > IFillingRecipeVersionEntity

# Interface: IFillingRecipeVersionEntity

Complete details for a single version of a filling recipe

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

[versionSpec](./IFillingRecipeVersionEntity.versionSpec.md)

</td><td>

`readonly`

</td><td>

[FillingVersionSpec](../../type-aliases/FillingVersionSpec.md)

</td><td>

Unique identifier for this version

</td></tr>
<tr><td>

[createdDate](./IFillingRecipeVersionEntity.createdDate.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Date this version was created (ISO 8601 format)

</td></tr>
<tr><td>

[ingredients](./IFillingRecipeVersionEntity.ingredients.md)

</td><td>

`readonly`

</td><td>

readonly [IFillingIngredientEntity](../../interfaces/IFillingIngredientEntity.md)[]

</td><td>

Ingredients used in this version of the filling recipe

</td></tr>
<tr><td>

[baseWeight](./IFillingRecipeVersionEntity.baseWeight.md)

</td><td>

`readonly`

</td><td>

[Measurement](../../type-aliases/Measurement.md)

</td><td>

Base weight of the filling recipe (sum of all ingredient amounts)

</td></tr>
<tr><td>

[yield](./IFillingRecipeVersionEntity.yield.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional yield description (e.g., "50 bonbons")

</td></tr>
<tr><td>

[notes](./IFillingRecipeVersionEntity.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[]

</td><td>

Optional categorized notes about this version

</td></tr>
<tr><td>

[ratings](./IFillingRecipeVersionEntity.ratings.md)

</td><td>

`readonly`

</td><td>

readonly [IFillingRating](../../interfaces/IFillingRating.md)[]

</td><td>

Optional ratings for this version

</td></tr>
<tr><td>

[procedures](./IFillingRecipeVersionEntity.procedures.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](../../interfaces/IOptionsWithPreferred.md)&lt;[IProcedureRefEntity](../../type-aliases/IProcedureRefEntity.md), [ProcedureId](../../type-aliases/ProcedureId.md)&gt;

</td><td>

Optional procedures associated with this version.

</td></tr>
</tbody></table>
