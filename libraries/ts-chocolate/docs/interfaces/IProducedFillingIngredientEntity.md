[Home](../README.md) > IProducedFillingIngredientEntity

# Interface: IProducedFillingIngredientEntity

Resolved filling ingredient with concrete choice.
Unlike IFillingIngredient which uses IIdsWithPreferred, this stores
the single actual ingredient that was used in production.

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

[ingredientId](./IProducedFillingIngredientEntity.ingredientId.md)

</td><td>

`readonly`

</td><td>

[IngredientId](../type-aliases/IngredientId.md)

</td><td>

The single selected ingredient ID

</td></tr>
<tr><td>

[amount](./IProducedFillingIngredientEntity.amount.md)

</td><td>

`readonly`

</td><td>

[Measurement](../type-aliases/Measurement.md)

</td><td>

Actual amount used

</td></tr>
<tr><td>

[unit](./IProducedFillingIngredientEntity.unit.md)

</td><td>

`readonly`

</td><td>

[MeasurementUnit](../type-aliases/MeasurementUnit.md)

</td><td>

Measurement unit (default: 'g')

</td></tr>
<tr><td>

[modifiers](./IProducedFillingIngredientEntity.modifiers.md)

</td><td>

`readonly`

</td><td>

[IIngredientModifiers](IIngredientModifiers.md)

</td><td>

Measurement modifiers (spoonLevel, toTaste) - production metadata

</td></tr>
<tr><td>

[notes](./IProducedFillingIngredientEntity.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](ICategorizedNote.md)[]

</td><td>

Optional categorized notes about this ingredient usage

</td></tr>
</tbody></table>
