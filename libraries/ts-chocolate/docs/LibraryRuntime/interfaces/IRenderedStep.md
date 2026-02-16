[Home](../../README.md) > [LibraryRuntime](../README.md) > IRenderedStep

# Interface: IRenderedStep

A rendered procedure step with resolved template values.

**Extends:** [`IResolvedProcedureStep`](../../interfaces/IResolvedProcedureStep.md)

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

[renderedDescription](./IRenderedStep.renderedDescription.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The rendered description with all template values resolved.

</td></tr>
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

[Task](../../classes/Task.md)

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

[Minutes](../../type-aliases/Minutes.md)

</td><td>

Time actively working on this step (overrides task default)

</td></tr>
<tr><td>

[waitTime](./IResolvedProcedureStep.waitTime.md)

</td><td>

`readonly`

</td><td>

[Minutes](../../type-aliases/Minutes.md)

</td><td>

Passive waiting time (overrides task default)

</td></tr>
<tr><td>

[holdTime](./IResolvedProcedureStep.holdTime.md)

</td><td>

`readonly`

</td><td>

[Minutes](../../type-aliases/Minutes.md)

</td><td>

Time to hold at a temperature (overrides task default)

</td></tr>
<tr><td>

[temperature](./IResolvedProcedureStep.temperature.md)

</td><td>

`readonly`

</td><td>

[Celsius](../../type-aliases/Celsius.md)

</td><td>

Target temperature for this step (overrides task default)

</td></tr>
<tr><td>

[notes](./IResolvedProcedureStep.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[]

</td><td>

Optional categorized notes for this step

</td></tr>
</tbody></table>
