[Home](../../README.md) > [Entities](../README.md) > IMoldedBonBonYield

# Interface: IMoldedBonBonYield

Frame-based yield specification for molded bonbons.
Stores frames + buffer percentage as primary values; count is computed from mold.

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

[yieldType](./IMoldedBonBonYield.yieldType.md)

</td><td>

`readonly`

</td><td>

"frames"

</td><td>

Discriminator for yield type

</td></tr>
<tr><td>

[frames](./IMoldedBonBonYield.frames.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Number of frames to produce (primary storage)

</td></tr>
<tr><td>

[bufferPercentage](./IMoldedBonBonYield.bufferPercentage.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Buffer percentage (e.g., 0.1 for 10% overfill)

</td></tr>
<tr><td>

[count](./IMoldedBonBonYield.count.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Computed count: frames × cavitiesPerFrame

</td></tr>
<tr><td>

[unit](./IMoldedBonBonYield.unit.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Unit description (usually 'pieces')

</td></tr>
<tr><td>

[weightPerPiece](./IMoldedBonBonYield.weightPerPiece.md)

</td><td>

`readonly`

</td><td>

[Measurement](../../type-aliases/Measurement.md)

</td><td>

Weight per piece in grams (from mold.cavityWeight)

</td></tr>
</tbody></table>
