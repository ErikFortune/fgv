[Home](../README.md) > ITaskEntity

# Interface: ITaskEntity

A reusable task template with runtime-computed properties.
Extends ITaskData with requiredVariables extracted from the template.

**Extends:** [`IRawTaskEntity`](IRawTaskEntity.md)

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

[requiredVariables](./ITaskEntity.requiredVariables.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Required variables extracted from the template at runtime.

</td></tr>
<tr><td>

[baseId](./IRawTaskEntity.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseTaskId](../type-aliases/BaseTaskId.md)

</td><td>

Base task identifier (unique within collection)

</td></tr>
<tr><td>

[name](./IRawTaskEntity.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Human-readable name of the task

</td></tr>
<tr><td>

[template](./IRawTaskEntity.template.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Mustache template for the task description.

</td></tr>
<tr><td>

[defaultActiveTime](./IRawTaskEntity.defaultActiveTime.md)

</td><td>

`readonly`

</td><td>

[Minutes](../type-aliases/Minutes.md)

</td><td>

Optional default active time (can be overridden by step)

</td></tr>
<tr><td>

[defaultWaitTime](./IRawTaskEntity.defaultWaitTime.md)

</td><td>

`readonly`

</td><td>

[Minutes](../type-aliases/Minutes.md)

</td><td>

Optional default wait time (can be overridden by step)

</td></tr>
<tr><td>

[defaultHoldTime](./IRawTaskEntity.defaultHoldTime.md)

</td><td>

`readonly`

</td><td>

[Minutes](../type-aliases/Minutes.md)

</td><td>

Optional default hold time (can be overridden by step)

</td></tr>
<tr><td>

[defaultTemperature](./IRawTaskEntity.defaultTemperature.md)

</td><td>

`readonly`

</td><td>

[Celsius](../type-aliases/Celsius.md)

</td><td>

Optional default temperature (can be overridden by step)

</td></tr>
<tr><td>

[notes](./IRawTaskEntity.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](ICategorizedNote.md)[]

</td><td>

Optional categorized notes about the task

</td></tr>
<tr><td>

[tags](./IRawTaskEntity.tags.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Optional tags for categorization and search

</td></tr>
<tr><td>

[defaults](./IRawTaskEntity.defaults.md)

</td><td>

`readonly`

</td><td>

Readonly&lt;Record&lt;string, unknown&gt;&gt;

</td><td>

Optional default values for template placeholders.

</td></tr>
</tbody></table>
