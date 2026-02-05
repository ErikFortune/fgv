[Home](../../README.md) > [Entities](../README.md) > IScalingRefEntity

# Interface: IScalingRefEntity

Lightweight scaling reference - the default storage format for scaled filling recipes.
Stores only the reference and scale parameters, not ingredient snapshots.

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

[sourceVersionId](./IScalingRefEntity.sourceVersionId.md)

</td><td>

`readonly`

</td><td>

[FillingVersionId](../../type-aliases/FillingVersionId.md)

</td><td>

Source filling recipe version ID (format: "sourceId.fillingId@versionSpec")

</td></tr>
<tr><td>

[scaleFactor](./IScalingRefEntity.scaleFactor.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Scaling factor applied

</td></tr>
<tr><td>

[targetWeight](./IScalingRefEntity.targetWeight.md)

</td><td>

`readonly`

</td><td>

[Measurement](../../type-aliases/Measurement.md)

</td><td>

Target weight requested

</td></tr>
<tr><td>

[createdDate](./IScalingRefEntity.createdDate.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Date the scaling was created (ISO 8601 format)

</td></tr>
</tbody></table>
