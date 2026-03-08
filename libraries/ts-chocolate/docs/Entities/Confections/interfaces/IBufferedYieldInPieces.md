[Home](../../../README.md) > [Entities](../../README.md) > [Confections](../README.md) > IBufferedYieldInPieces

# Interface: IBufferedYieldInPieces

Yield specification for a produced bar truffle or rolled truffle.
Stores the minimal essential values; targetWeight is derived at runtime.

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

[count](./IBufferedYieldInPieces.count.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Number of pieces produced

</td></tr>
<tr><td>

[weightPerPiece](./IBufferedYieldInPieces.weightPerPiece.md)

</td><td>

`readonly`

</td><td>

[Measurement](../../../type-aliases/Measurement.md)

</td><td>

Weight per piece in grams

</td></tr>
<tr><td>

[bufferPercentage](./IBufferedYieldInPieces.bufferPercentage.md)

</td><td>

`readonly`

</td><td>

[Percentage](../../../type-aliases/Percentage.md)

</td><td>

Buffer percentage (e.g., 10 for 10% overfill)

</td></tr>
</tbody></table>
