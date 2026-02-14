[Home](../README.md) > IResolvedDecorationIngredient

# Interface: IResolvedDecorationIngredient

A resolved decoration ingredient with runtime ingredient reference.

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

[ingredient](./IResolvedDecorationIngredient.ingredient.md)

</td><td>

`readonly`

</td><td>

[AnyIngredient](../type-aliases/AnyIngredient.md)

</td><td>

The resolved preferred ingredient.

</td></tr>
<tr><td>

[ingredientIds](./IResolvedDecorationIngredient.ingredientIds.md)

</td><td>

`readonly`

</td><td>

[IIdsWithPreferred](IIdsWithPreferred.md)&lt;[IngredientId](../type-aliases/IngredientId.md)&gt;

</td><td>

All ingredient IDs (including alternates).

</td></tr>
<tr><td>

[amount](./IResolvedDecorationIngredient.amount.md)

</td><td>

`readonly`

</td><td>

[Measurement](../type-aliases/Measurement.md)

</td><td>

Amount of this ingredient in grams.

</td></tr>
<tr><td>

[notes](./IResolvedDecorationIngredient.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](ICategorizedNote.md)[]

</td><td>

Optional categorized notes about this ingredient usage.

</td></tr>
</tbody></table>
