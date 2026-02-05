[Home](../README.md) > IInlineTaskEntity

# Interface: IInlineTaskEntity

An inline task defined directly in a procedure step.
Contains a full ITaskData definition with a synthetic baseId (derived from procedure/step)
plus params for rendering.

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

[task](./IInlineTaskEntity.task.md)

</td><td>

`readonly`

</td><td>

[IRawTaskEntity](IRawTaskEntity.md)

</td><td>

Full task definition with synthetic baseId (e.g., `procedureId.step-N`)

</td></tr>
<tr><td>

[params](./IInlineTaskEntity.params.md)

</td><td>

`readonly`

</td><td>

Record&lt;string, unknown&gt;

</td><td>

Parameter values for rendering the template

</td></tr>
</tbody></table>
