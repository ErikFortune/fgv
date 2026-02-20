[Home](../../README.md) > [LibraryRuntime](../README.md) > IConfectionScalingResult

# Interface: IConfectionScalingResult

Result of scaling a confection variation to a target yield.

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

[effectiveCount](./IConfectionScalingResult.effectiveCount.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Actual piece count after scaling

</td></tr>
<tr><td>

[effectiveFrames](./IConfectionScalingResult.effectiveFrames.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Actual frame count (molded bonbon only)

</td></tr>
<tr><td>

[scaleFactor](./IConfectionScalingResult.scaleFactor.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Overall scale factor vs recipe yield count

</td></tr>
<tr><td>

[slots](./IConfectionScalingResult.slots.md)

</td><td>

`readonly`

</td><td>

readonly [AnyScaledSlot](../../type-aliases/AnyScaledSlot.md)[]

</td><td>

Per-slot scaled filling data

</td></tr>
</tbody></table>
