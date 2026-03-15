[Home](../README.md) > IResolvedFillingIngredient

# Interface: IResolvedFillingIngredient

A resolved ingredient reference with full ingredient data and alternates.
This is the primary interface for accessing recipe ingredients in the runtime layer.

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

[ingredient](./IResolvedFillingIngredient.ingredient.md)

</td><td>

`readonly`

</td><td>

TIngredient

</td><td>

The fully resolved ingredient object

</td></tr>
<tr><td>

[amount](./IResolvedFillingIngredient.amount.md)

</td><td>

`readonly`

</td><td>

[Measurement](../type-aliases/Measurement.md)

</td><td>

Amount in grams

</td></tr>
<tr><td>

[notes](./IResolvedFillingIngredient.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](ICategorizedNote.md)[]

</td><td>

Optional notes for this specific ingredient usage

</td></tr>
<tr><td>

[alternates](./IResolvedFillingIngredient.alternates.md)

</td><td>

`readonly`

</td><td>

readonly TIngredient[]

</td><td>

Resolved alternate ingredients that can substitute for the primary

</td></tr>
<tr><td>

[entity](./IResolvedFillingIngredient.entity.md)

</td><td>

`readonly`

</td><td>

[IFillingIngredientEntity](IFillingIngredientEntity.md)

</td><td>

The original ingredient entity reference data

</td></tr>
</tbody></table>
