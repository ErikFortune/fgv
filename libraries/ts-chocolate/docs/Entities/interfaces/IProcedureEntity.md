[Home](../../README.md) > [Entities](../README.md) > IProcedureEntity

# Interface: IProcedureEntity

Represents a procedure for making chocolate confections

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

[baseId](./IProcedureEntity.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseProcedureId](../../type-aliases/BaseProcedureId.md)

</td><td>

Base procedure identifier (unique within source)

</td></tr>
<tr><td>

[name](./IProcedureEntity.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Human-readable name of the procedure

</td></tr>
<tr><td>

[description](./IProcedureEntity.description.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional description of the procedure

</td></tr>
<tr><td>

[category](./IProcedureEntity.category.md)

</td><td>

`readonly`

</td><td>

[ProcedureType](../../type-aliases/ProcedureType.md)

</td><td>

Optional procedure category this procedure applies to.

</td></tr>
<tr><td>

[steps](./IProcedureEntity.steps.md)

</td><td>

`readonly`

</td><td>

readonly [IProcedureStepEntity](../../interfaces/IProcedureStepEntity.md)[]

</td><td>

Steps of the procedure in order

</td></tr>
<tr><td>

[tags](./IProcedureEntity.tags.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Optional tags for categorization and search

</td></tr>
<tr><td>

[notes](./IProcedureEntity.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[]

</td><td>

Optional categorized notes about the procedure

</td></tr>
</tbody></table>
