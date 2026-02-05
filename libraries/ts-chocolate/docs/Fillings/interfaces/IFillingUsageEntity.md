[Home](../../README.md) > [Fillings](../README.md) > IFillingUsageEntity

# Interface: IFillingUsageEntity

Record of a filling recipe being used (for production tracking)

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

[date](./IFillingUsageEntity.date.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Date of use in ISO 8601 format

</td></tr>
<tr><td>

[versionSpec](./IFillingUsageEntity.versionSpec.md)

</td><td>

`readonly`

</td><td>

[FillingVersionSpec](../../type-aliases/FillingVersionSpec.md)

</td><td>

Which version was used

</td></tr>
<tr><td>

[scaledWeight](./IFillingUsageEntity.scaledWeight.md)

</td><td>

`readonly`

</td><td>

[Measurement](../../type-aliases/Measurement.md)

</td><td>

Scaled weight used for this production run

</td></tr>
<tr><td>

[scaleFactor](./IFillingUsageEntity.scaleFactor.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Optional scale factor for reference

</td></tr>
<tr><td>

[notes](./IFillingUsageEntity.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[]

</td><td>

Optional categorized notes about this usage

</td></tr>
<tr><td>

[modifiedVersionSpec](./IFillingUsageEntity.modifiedVersionSpec.md)

</td><td>

`readonly`

</td><td>

[FillingVersionSpec](../../type-aliases/FillingVersionSpec.md)

</td><td>

If modifications were made during this usage that created a new version,

</td></tr>
</tbody></table>
