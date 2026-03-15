[Home](../../README.md) > [Entities](../README.md) > IProcedureStepValidation

# Interface: IProcedureStepValidation

Runtime validation state for a procedure step.
This is computed at render/use time based on which TasksLibrary is available.

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

[status](./IProcedureStepValidation.status.md)

</td><td>

`readonly`

</td><td>

[TaskRefStatus](../../type-aliases/TaskRefStatus.md)

</td><td>

Validation status for task reference

</td></tr>
<tr><td>

[messages](./IProcedureStepValidation.messages.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Validation messages describing any issues

</td></tr>
</tbody></table>
