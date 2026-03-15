[Home](../../README.md) > [LibraryRuntime](../README.md) > IGanacheAnalysis

# Interface: IGanacheAnalysis

Blended characteristics for a ganache recipe

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

[characteristics](./IGanacheAnalysis.characteristics.md)

</td><td>

`readonly`

</td><td>

[IGanacheCharacteristics](../../interfaces/IGanacheCharacteristics.md)

</td><td>

Weighted average characteristics of all ingredients

</td></tr>
<tr><td>

[totalFat](./IGanacheAnalysis.totalFat.md)

</td><td>

`readonly`

</td><td>

[Percentage](../../type-aliases/Percentage.md)

</td><td>

Total fat percentage (cacaoFat + milkFat + otherFats)

</td></tr>
<tr><td>

[fatToWaterRatio](./IGanacheAnalysis.fatToWaterRatio.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Fat to water ratio (important for emulsion stability)

</td></tr>
<tr><td>

[sugarToWaterRatio](./IGanacheAnalysis.sugarToWaterRatio.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Sugar to water ratio (important for texture and preservation)

</td></tr>
<tr><td>

[totalWeight](./IGanacheAnalysis.totalWeight.md)

</td><td>

`readonly`

</td><td>

[Measurement](../../type-aliases/Measurement.md)

</td><td>

Total weight of the recipe

</td></tr>
</tbody></table>
