[Home](../README.md) > IResolvedProcedureStep

# Interface: IResolvedProcedureStep

A procedure step with a fully materialized runtime Task.

Unlike the entity-layer IProcedureStepEntity, this interface does not
expose raw task entities. Both task-ref and inline tasks are materialized into
a runtime Task object.

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

[order](./IResolvedProcedureStep.order.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Step order number (1-based)

</td></tr>
<tr><td>

[resolvedTask](./IResolvedProcedureStep.resolvedTask.md)

</td><td>

`readonly`

</td><td>

[Task](../classes/Task.md)

</td><td>

The materialized runtime task (always present for both refs and inline)

</td></tr>
<tr><td>

[params](./IResolvedProcedureStep.params.md)

</td><td>

`readonly`

</td><td>

Record&lt;string, unknown&gt;

</td><td>

Parameter values for template rendering

</td></tr>
<tr><td>

[isInline](./IResolvedProcedureStep.isInline.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

True if this step uses an inline task definition (not a library reference)

</td></tr>
<tr><td>

[activeTime](./IResolvedProcedureStep.activeTime.md)

</td><td>

`readonly`

</td><td>

[Minutes](../type-aliases/Minutes.md)

</td><td>

Time actively working on this step (overrides task default)

</td></tr>
<tr><td>

[waitTime](./IResolvedProcedureStep.waitTime.md)

</td><td>

`readonly`

</td><td>

[Minutes](../type-aliases/Minutes.md)

</td><td>

Passive waiting time (overrides task default)

</td></tr>
<tr><td>

[holdTime](./IResolvedProcedureStep.holdTime.md)

</td><td>

`readonly`

</td><td>

[Minutes](../type-aliases/Minutes.md)

</td><td>

Time to hold at a temperature (overrides task default)

</td></tr>
<tr><td>

[temperature](./IResolvedProcedureStep.temperature.md)

</td><td>

`readonly`

</td><td>

[Celsius](../type-aliases/Celsius.md)

</td><td>

Target temperature for this step (overrides task default)

</td></tr>
<tr><td>

[notes](./IResolvedProcedureStep.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](ICategorizedNote.md)[]

</td><td>

Optional categorized notes for this step

</td></tr>
</tbody></table>
