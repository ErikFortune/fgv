[Home](../README.md) > ITask

# Interface: ITask

A resolved view of a task with rendering capabilities.

This interface provides runtime-layer access to task data with:
- Composite identity (`id`, `sourceId`) for cross-source references
- Rendering with library context
- Parameter validation

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

[id](./ITask.id.md)

</td><td>

`readonly`

</td><td>

[TaskId](../type-aliases/TaskId.md)

</td><td>

The composite task ID (e.g., "common.melt-chocolate").

</td></tr>
<tr><td>

[baseId](./ITask.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseTaskId](../type-aliases/BaseTaskId.md)

</td><td>

The base task ID within the source.

</td></tr>
<tr><td>

[name](./ITask.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Human-readable name

</td></tr>
<tr><td>

[template](./ITask.template.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The Mustache template string

</td></tr>
<tr><td>

[requiredVariables](./ITask.requiredVariables.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Required variables extracted from the template

</td></tr>
<tr><td>

[defaultActiveTime](./ITask.defaultActiveTime.md)

</td><td>

`readonly`

</td><td>

[Minutes](../type-aliases/Minutes.md)

</td><td>

Optional default active time

</td></tr>
<tr><td>

[defaultWaitTime](./ITask.defaultWaitTime.md)

</td><td>

`readonly`

</td><td>

[Minutes](../type-aliases/Minutes.md)

</td><td>

Optional default wait time

</td></tr>
<tr><td>

[defaultHoldTime](./ITask.defaultHoldTime.md)

</td><td>

`readonly`

</td><td>

[Minutes](../type-aliases/Minutes.md)

</td><td>

Optional default hold time

</td></tr>
<tr><td>

[defaultTemperature](./ITask.defaultTemperature.md)

</td><td>

`readonly`

</td><td>

[Celsius](../type-aliases/Celsius.md)

</td><td>

Optional default temperature

</td></tr>
<tr><td>

[notes](./ITask.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](ICategorizedNote.md)[]

</td><td>

Optional categorized notes

</td></tr>
<tr><td>

[tags](./ITask.tags.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Optional tags

</td></tr>
<tr><td>

[defaults](./ITask.defaults.md)

</td><td>

`readonly`

</td><td>

Readonly&lt;Record&lt;string, unknown&gt;&gt;

</td><td>

Optional default values for template placeholders

</td></tr>
<tr><td>

[entity](./ITask.entity.md)

</td><td>

`readonly`

</td><td>

[IRawTaskEntity](IRawTaskEntity.md)

</td><td>

Gets the underlying task data entity.

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[validateParams(params)](./ITask.validateParams.md)

</td><td>



</td><td>

Validates that params (combined with defaults) satisfy required variables.

</td></tr>
<tr><td>

[render(params)](./ITask.render.md)

</td><td>



</td><td>

Renders the task template with the given params (merged with defaults).

</td></tr>
<tr><td>

[validateAndRender(params)](./ITask.validateAndRender.md)

</td><td>



</td><td>

Validates params and renders the template if validation passes.

</td></tr>
</tbody></table>
