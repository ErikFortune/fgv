[Home](../README.md) > IFillingRecipeScaleOptions

# Interface: IFillingRecipeScaleOptions

Options for filling recipe scaling (extends variation options with variation selection)

**Extends:** [`IVariationScaleOptions`](IVariationScaleOptions.md)

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

[variationSpec](./IFillingRecipeScaleOptions.variationSpec.md)

</td><td>

`readonly`

</td><td>

[FillingRecipeVariationSpec](../type-aliases/FillingRecipeVariationSpec.md)

</td><td>

Filling recipe variation to scale (default: golden variation)

</td></tr>
<tr><td>

[precision](./IVariationScaleOptions.precision.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Number of decimal places for scaled amounts (default: 1)

</td></tr>
<tr><td>

[minimumAmount](./IVariationScaleOptions.minimumAmount.md)

</td><td>

`readonly`

</td><td>

[Measurement](../type-aliases/Measurement.md)

</td><td>

Minimum amount to show in scaled filling recipe (default: 0.1)

</td></tr>
</tbody></table>
