[Home](../README.md) > IFillingRecipeVariationEntity

# Interface: IFillingRecipeVariationEntity

Complete details for a single variation of a filling recipe

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

[variationSpec](./IFillingRecipeVariationEntity.variationSpec.md)

</td><td>

`readonly`

</td><td>

[FillingRecipeVariationSpec](../type-aliases/FillingRecipeVariationSpec.md)

</td><td>

Unique identifier for this variation

</td></tr>
<tr><td>

[createdDate](./IFillingRecipeVariationEntity.createdDate.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Date this variation was created (ISO 8601 format)

</td></tr>
<tr><td>

[ingredients](./IFillingRecipeVariationEntity.ingredients.md)

</td><td>

`readonly`

</td><td>

readonly [IFillingIngredientEntity](IFillingIngredientEntity.md)[]

</td><td>

Ingredients used in this variation of the filling recipe

</td></tr>
<tr><td>

[baseWeight](./IFillingRecipeVariationEntity.baseWeight.md)

</td><td>

`readonly`

</td><td>

[Measurement](../type-aliases/Measurement.md)

</td><td>

Base weight of the filling recipe (sum of all ingredient amounts)

</td></tr>
<tr><td>

[yield](./IFillingRecipeVariationEntity.yield.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional yield description (e.g., "50 bonbons")

</td></tr>
<tr><td>

[notes](./IFillingRecipeVariationEntity.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](ICategorizedNote.md)[]

</td><td>

Optional categorized notes about this variation

</td></tr>
<tr><td>

[ratings](./IFillingRecipeVariationEntity.ratings.md)

</td><td>

`readonly`

</td><td>

readonly [IFillingRating](IFillingRating.md)[]

</td><td>

Optional ratings for this variation

</td></tr>
<tr><td>

[procedures](./IFillingRecipeVariationEntity.procedures.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](IOptionsWithPreferred.md)&lt;[IProcedureRefEntity](../type-aliases/IProcedureRefEntity.md), [ProcedureId](../type-aliases/ProcedureId.md)&gt;

</td><td>

Optional procedures associated with this variation.

</td></tr>
</tbody></table>
