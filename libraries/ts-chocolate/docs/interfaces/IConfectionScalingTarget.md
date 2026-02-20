[Home](../README.md) > IConfectionScalingTarget

# Interface: IConfectionScalingTarget

Scaling target for a confection preview.

For molded bonbons, `targetFrames` is the primary input.
For bar/rolled truffles, `targetCount` is the primary input.
`fillingSelections` maps slotId → selected filling option ID (from viewSettings).

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

[targetFrames](./IConfectionScalingTarget.targetFrames.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Target frames for molded bonbon (primary input)

</td></tr>
<tr><td>

[bufferPercentage](./IConfectionScalingTarget.bufferPercentage.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Buffer overfill percentage for molded bonbon (default 0.1 = 10%)

</td></tr>
<tr><td>

[selectedMoldId](./IConfectionScalingTarget.selectedMoldId.md)

</td><td>

`readonly`

</td><td>

[MoldId](../type-aliases/MoldId.md)

</td><td>

Override the mold to use (falls back to variation's preferred mold)

</td></tr>
<tr><td>

[targetCount](./IConfectionScalingTarget.targetCount.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Target piece count for bar/rolled truffle

</td></tr>
<tr><td>

[fillingSelections](./IConfectionScalingTarget.fillingSelections.md)

</td><td>

`readonly`

</td><td>

Readonly&lt;Record&lt;string, string&gt;&gt;

</td><td>

Per-slot filling selection: slotId → optionId (from viewSettings)

</td></tr>
</tbody></table>
