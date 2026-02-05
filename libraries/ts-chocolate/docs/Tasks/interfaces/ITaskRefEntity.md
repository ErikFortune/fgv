[Home](../../README.md) > [Tasks](../README.md) > ITaskRefEntity

# Interface: ITaskRefEntity

Represents a step's reference to a reusable task with parameter values.

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

[taskId](./ITaskRefEntity.taskId.md)

</td><td>

`readonly`

</td><td>

[TaskId](../../type-aliases/TaskId.md)

</td><td>

Full task ID (collectionId.baseTaskId)

</td></tr>
<tr><td>

[params](./ITaskRefEntity.params.md)

</td><td>

`readonly`

</td><td>

Record&lt;string, unknown&gt;

</td><td>

Parameter values to pass to the task template.

</td></tr>
</tbody></table>
