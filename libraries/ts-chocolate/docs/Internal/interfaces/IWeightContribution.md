[Home](../../README.md) > [Internal](../README.md) > IWeightContribution

# Interface: IWeightContribution

Result of calculating weight contribution for a single ingredient.

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

[ingredientId](./IWeightContribution.ingredientId.md)

</td><td>

`readonly`

</td><td>

[IngredientId](../../type-aliases/IngredientId.md)

</td><td>

The preferred ingredient ID

</td></tr>
<tr><td>

[amount](./IWeightContribution.amount.md)

</td><td>

`readonly`

</td><td>

[Measurement](../../type-aliases/Measurement.md)

</td><td>

Original amount in filling recipe

</td></tr>
<tr><td>

[unit](./IWeightContribution.unit.md)

</td><td>

`readonly`

</td><td>

[MeasurementUnit](../../type-aliases/MeasurementUnit.md)

</td><td>

Original unit in filling recipe

</td></tr>
<tr><td>

[weightGrams](./IWeightContribution.weightGrams.md)

</td><td>

`readonly`

</td><td>

[Measurement](../../type-aliases/Measurement.md)

</td><td>

Weight contribution in grams after applying yieldFactor (0 if excluded)

</td></tr>
<tr><td>

[contributesToWeight](./IWeightContribution.contributesToWeight.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether this ingredient contributes to total weight

</td></tr>
<tr><td>

[yieldFactor](./IWeightContribution.yieldFactor.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Yield factor applied (1.0 if not specified)

</td></tr>
<tr><td>

[processNote](./IWeightContribution.processNote.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Human-readable process note, if any

</td></tr>
</tbody></table>
