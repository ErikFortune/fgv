[Home](../../README.md) > [Entities](../README.md) > IFillingIngredientEntity

# Interface: IFillingIngredientEntity

Reference to an ingredient used in a filling recipe.
Uses IIdsWithPreferred pattern - `ids` contains all valid ingredient options,
`preferredId` indicates the default/recommended one.

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

[ingredient](./IFillingIngredientEntity.ingredient.md)

</td><td>

`readonly`

</td><td>

[IIdsWithPreferred](../../interfaces/IIdsWithPreferred.md)&lt;[IngredientId](../../type-aliases/IngredientId.md)&gt;

</td><td>

Available ingredient options with preferred selection.

</td></tr>
<tr><td>

[amount](./IFillingIngredientEntity.amount.md)

</td><td>

`readonly`

</td><td>

[Measurement](../../type-aliases/Measurement.md)

</td><td>

Amount of this ingredient in the specified unit.

</td></tr>
<tr><td>

[unit](./IFillingIngredientEntity.unit.md)

</td><td>

`readonly`

</td><td>

[MeasurementUnit](../../type-aliases/MeasurementUnit.md)

</td><td>

Measurement unit for the amount.

</td></tr>
<tr><td>

[modifiers](./IFillingIngredientEntity.modifiers.md)

</td><td>

`readonly`

</td><td>

[IIngredientModifiers](../../interfaces/IIngredientModifiers.md)

</td><td>

Optional modifiers that qualify how the ingredient is measured or added.

</td></tr>
<tr><td>

[notes](./IFillingIngredientEntity.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[]

</td><td>

Optional categorized notes for this specific ingredient usage

</td></tr>
</tbody></table>
