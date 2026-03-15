[Home](../../../README.md) > [UserLibrary](../../README.md) > [Session](../README.md) > IMoldChangeAnalysis

# Interface: IMoldChangeAnalysis

Analysis of mold change impact on a molded bonbon confection.
Returned by setMold() to show weight changes before confirmation.

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

[oldMoldId](./IMoldChangeAnalysis.oldMoldId.md)

</td><td>

`readonly`

</td><td>

[MoldId](../../../type-aliases/MoldId.md)

</td><td>

ID of the current mold

</td></tr>
<tr><td>

[newMoldId](./IMoldChangeAnalysis.newMoldId.md)

</td><td>

`readonly`

</td><td>

[MoldId](../../../type-aliases/MoldId.md)

</td><td>

ID of the proposed new mold

</td></tr>
<tr><td>

[oldTotalWeight](./IMoldChangeAnalysis.oldTotalWeight.md)

</td><td>

`readonly`

</td><td>

[Measurement](../../../type-aliases/Measurement.md)

</td><td>

Total cavity weight with current mold

</td></tr>
<tr><td>

[newTotalWeight](./IMoldChangeAnalysis.newTotalWeight.md)

</td><td>

`readonly`

</td><td>

[Measurement](../../../type-aliases/Measurement.md)

</td><td>

Total cavity weight with new mold

</td></tr>
<tr><td>

[weightDelta](./IMoldChangeAnalysis.weightDelta.md)

</td><td>

`readonly`

</td><td>

[Measurement](../../../type-aliases/Measurement.md)

</td><td>

Weight difference (positive = more filling needed)

</td></tr>
<tr><td>

[fillingSessionsAffected](./IMoldChangeAnalysis.fillingSessionsAffected.md)

</td><td>

`readonly`

</td><td>

readonly [SlotId](../../../type-aliases/SlotId.md)[]

</td><td>

Slot IDs of filling sessions that will be affected

</td></tr>
<tr><td>

[requiresRescaling](./IMoldChangeAnalysis.requiresRescaling.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether the weight change requires rescaling fillings

</td></tr>
</tbody></table>
