[Home](../../README.md) > [LibraryRuntime](../README.md) > Task

# Class: Task

A resolved view of a task with rendering capabilities.

Task wraps a data-layer Task and provides:
- Composite identity (TaskId) for cross-source references
- Template parsing and required variable extraction
- Parameter validation
- Template rendering
- Context access for resolving task references (future use)

**Implements:** [`ITask`](../../interfaces/ITask.md)

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

[id](./Task.id.md)

</td><td>

`readonly`

</td><td>

[TaskId](../../type-aliases/TaskId.md)

</td><td>

The composite task ID (e.g., "common.melt-chocolate")

</td></tr>
<tr><td>

[baseId](./Task.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseTaskId](../../type-aliases/BaseTaskId.md)

</td><td>

The base task ID within the source

</td></tr>
<tr><td>

[name](./Task.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Human-readable name of the task

</td></tr>
<tr><td>

[template](./Task.template.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The Mustache template string

</td></tr>
<tr><td>

[requiredVariables](./Task.requiredVariables.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Required variables extracted from the template.

</td></tr>
<tr><td>

[defaultActiveTime](./Task.defaultActiveTime.md)

</td><td>

`readonly`

</td><td>

[Minutes](../../type-aliases/Minutes.md) | undefined

</td><td>

Optional default active time

</td></tr>
<tr><td>

[defaultWaitTime](./Task.defaultWaitTime.md)

</td><td>

`readonly`

</td><td>

[Minutes](../../type-aliases/Minutes.md) | undefined

</td><td>

Optional default wait time

</td></tr>
<tr><td>

[defaultHoldTime](./Task.defaultHoldTime.md)

</td><td>

`readonly`

</td><td>

[Minutes](../../type-aliases/Minutes.md) | undefined

</td><td>

Optional default hold time

</td></tr>
<tr><td>

[defaultTemperature](./Task.defaultTemperature.md)

</td><td>

`readonly`

</td><td>

[Celsius](../../type-aliases/Celsius.md) | undefined

</td><td>

Optional default temperature

</td></tr>
<tr><td>

[notes](./Task.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[] | undefined

</td><td>

Optional categorized notes

</td></tr>
<tr><td>

[tags](./Task.tags.md)

</td><td>

`readonly`

</td><td>

readonly string[] | undefined

</td><td>

Optional tags

</td></tr>
<tr><td>

[defaults](./Task.defaults.md)

</td><td>

`readonly`

</td><td>

Readonly&lt;Record&lt;string, unknown&gt;&gt; | undefined

</td><td>

Optional default values for template placeholders

</td></tr>
<tr><td>

[entity](./Task.entity.md)

</td><td>

`readonly`

</td><td>

[IRawTaskEntity](../../interfaces/IRawTaskEntity.md)

</td><td>

Gets the underlying task data entity

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

[create(context, id, task)](./Task.create.md)

</td><td>

`static`

</td><td>

Factory method for creating a Task.

</td></tr>
<tr><td>

[validateParams(params)](./Task.validateParams.md)

</td><td>



</td><td>

Validates that params (combined with defaults) satisfy required variables.

</td></tr>
<tr><td>

[render(params)](./Task.render.md)

</td><td>



</td><td>

Renders the task template with the given params (merged with defaults).

</td></tr>
<tr><td>

[validateAndRender(params)](./Task.validateAndRender.md)

</td><td>



</td><td>

Validates params and renders the template if validation passes.

</td></tr>
</tbody></table>
