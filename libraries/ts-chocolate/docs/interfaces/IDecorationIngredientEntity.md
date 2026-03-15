[Home](../README.md) > IDecorationIngredientEntity

# Interface: IDecorationIngredientEntity

An ingredient used in a decoration, with alternates and an amount.

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

[ingredient](./IDecorationIngredientEntity.ingredient.md)

</td><td>

`readonly`

</td><td>

[IIdsWithPreferred](IIdsWithPreferred.md)&lt;[IngredientId](../type-aliases/IngredientId.md)&gt;

</td><td>

Ingredient options with preferred selection.

</td></tr>
<tr><td>

[amount](./IDecorationIngredientEntity.amount.md)

</td><td>

`readonly`

</td><td>

[Measurement](../type-aliases/Measurement.md)

</td><td>

Amount of this ingredient in grams.

</td></tr>
<tr><td>

[notes](./IDecorationIngredientEntity.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](ICategorizedNote.md)[]

</td><td>

Optional categorized notes about this ingredient usage.

</td></tr>
</tbody></table>
