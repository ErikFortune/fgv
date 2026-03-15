[Home](../README.md) > IValidatedProcedureStep

# Interface: IValidatedProcedureStep

A procedure step with runtime validation state attached.
Used during rendering when validation has been performed.

**Extends:** [`IProcedureStepEntity`](IProcedureStepEntity.md)

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

[validation](./IValidatedProcedureStep.validation.md)

</td><td>

`readonly`

</td><td>

[IProcedureStepValidation](IProcedureStepValidation.md)

</td><td>

Runtime validation state (computed, not persisted)

</td></tr>
<tr><td>

[order](./IProcedureStepEntity.order.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Order number of this step (1-based)

</td></tr>
<tr><td>

[task](./IProcedureStepEntity.task.md)

</td><td>

`readonly`

</td><td>

[ITaskEntityInvocation](../type-aliases/ITaskEntityInvocation.md)

</td><td>

The task for this step - either a reference to a public task or an inline task definition

</td></tr>
<tr><td>

[activeTime](./IProcedureStepEntity.activeTime.md)

</td><td>

`readonly`

</td><td>

[Minutes](../type-aliases/Minutes.md)

</td><td>

Time actively working on this step (overrides task default)

</td></tr>
<tr><td>

[waitTime](./IProcedureStepEntity.waitTime.md)

</td><td>

`readonly`

</td><td>

[Minutes](../type-aliases/Minutes.md)

</td><td>

Passive waiting time (overrides task default)

</td></tr>
<tr><td>

[holdTime](./IProcedureStepEntity.holdTime.md)

</td><td>

`readonly`

</td><td>

[Minutes](../type-aliases/Minutes.md)

</td><td>

Time to hold at a temperature (overrides task default)

</td></tr>
<tr><td>

[temperature](./IProcedureStepEntity.temperature.md)

</td><td>

`readonly`

</td><td>

[Celsius](../type-aliases/Celsius.md)

</td><td>

Target temperature for this step (overrides task default)

</td></tr>
<tr><td>

[notes](./IProcedureStepEntity.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](ICategorizedNote.md)[]

</td><td>

Optional categorized notes for this step

</td></tr>
</tbody></table>
