[Home](../README.md) > IProducedFillingEntity

# Interface: IProducedFillingEntity

Produced filling with concrete choices.
Captures what was actually made during a filling production session.

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

[versionId](./IProducedFillingEntity.versionId.md)

</td><td>

`readonly`

</td><td>

[FillingVersionId](../type-aliases/FillingVersionId.md)

</td><td>

Filling version ID that was produced

</td></tr>
<tr><td>

[scaleFactor](./IProducedFillingEntity.scaleFactor.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Scale factor applied

</td></tr>
<tr><td>

[targetWeight](./IProducedFillingEntity.targetWeight.md)

</td><td>

`readonly`

</td><td>

[Measurement](../type-aliases/Measurement.md)

</td><td>

Target weight for this production

</td></tr>
<tr><td>

[ingredients](./IProducedFillingEntity.ingredients.md)

</td><td>

`readonly`

</td><td>

readonly [IProducedFillingIngredientEntity](IProducedFillingIngredientEntity.md)[]

</td><td>

Resolved ingredients with concrete selections

</td></tr>
<tr><td>

[procedureId](./IProducedFillingEntity.procedureId.md)

</td><td>

`readonly`

</td><td>

[ProcedureId](../type-aliases/ProcedureId.md)

</td><td>

Resolved procedure ID if one was used

</td></tr>
<tr><td>

[notes](./IProducedFillingEntity.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](ICategorizedNote.md)[]

</td><td>

Optional categorized notes about production

</td></tr>
</tbody></table>
