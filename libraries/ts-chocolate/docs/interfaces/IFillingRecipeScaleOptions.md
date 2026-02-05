[Home](../README.md) > IFillingRecipeScaleOptions

# Interface: IFillingRecipeScaleOptions

Options for filling recipe scaling (extends version options with version selection)

**Extends:** [`IVersionScaleOptions`](IVersionScaleOptions.md)

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

[versionSpec](./IFillingRecipeScaleOptions.versionSpec.md)

</td><td>

`readonly`

</td><td>

[FillingVersionSpec](../type-aliases/FillingVersionSpec.md)

</td><td>

Filling recipe version to scale (default: golden version)

</td></tr>
<tr><td>

[precision](./IVersionScaleOptions.precision.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Number of decimal places for scaled amounts (default: 1)

</td></tr>
<tr><td>

[minimumAmount](./IVersionScaleOptions.minimumAmount.md)

</td><td>

`readonly`

</td><td>

[Measurement](../type-aliases/Measurement.md)

</td><td>

Minimum amount to show in scaled filling recipe (default: 0.1)

</td></tr>
</tbody></table>
