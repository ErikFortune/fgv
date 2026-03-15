[Home](../README.md) > Procedure

# Class: Procedure

A resolved view of a procedure with proper task resolution.

Procedure wraps a data-layer Procedure and provides:
- Composite identity (ProcedureId) for cross-source references
- Proper task resolution (not placeholders like the data-layer)
- Computed timing properties

Unlike the data-layer Procedure.render() which returns `[Task: taskId]` placeholders,
Procedure.render() actually resolves task references and renders their templates.

**Implements:** [`IProcedure`](../interfaces/IProcedure.md)

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

[id](./Procedure.id.md)

</td><td>

`readonly`

</td><td>

[ProcedureId](../type-aliases/ProcedureId.md)

</td><td>

The composite procedure ID (e.g., "common.ganache-basic")

</td></tr>
<tr><td>

[baseId](./Procedure.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseProcedureId](../type-aliases/BaseProcedureId.md)

</td><td>

The base procedure ID within the source

</td></tr>
<tr><td>

[name](./Procedure.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Human-readable name of the procedure

</td></tr>
<tr><td>

[description](./Procedure.description.md)

</td><td>

`readonly`

</td><td>

string | undefined

</td><td>

Optional description

</td></tr>
<tr><td>

[category](./Procedure.category.md)

</td><td>

`readonly`

</td><td>

[ProcedureType](../type-aliases/ProcedureType.md) | undefined

</td><td>

Optional category this procedure applies to

</td></tr>
<tr><td>

[tags](./Procedure.tags.md)

</td><td>

`readonly`

</td><td>

readonly string[] | undefined

</td><td>

Optional tags

</td></tr>
<tr><td>

[notes](./Procedure.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../interfaces/ICategorizedNote.md)[] | undefined

</td><td>

Optional categorized notes

</td></tr>
<tr><td>

[totalActiveTime](./Procedure.totalActiveTime.md)

</td><td>

`readonly`

</td><td>

[Minutes](../type-aliases/Minutes.md) | undefined

</td><td>

Total active time for all steps

</td></tr>
<tr><td>

[totalWaitTime](./Procedure.totalWaitTime.md)

</td><td>

`readonly`

</td><td>

[Minutes](../type-aliases/Minutes.md) | undefined

</td><td>

Total wait time for all steps

</td></tr>
<tr><td>

[totalHoldTime](./Procedure.totalHoldTime.md)

</td><td>

`readonly`

</td><td>

[Minutes](../type-aliases/Minutes.md) | undefined

</td><td>

Total hold time for all steps

</td></tr>
<tr><td>

[totalTime](./Procedure.totalTime.md)

</td><td>

`readonly`

</td><td>

[Minutes](../type-aliases/Minutes.md) | undefined

</td><td>

Total time (active + wait + hold)

</td></tr>
<tr><td>

[stepCount](./Procedure.stepCount.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Number of steps

</td></tr>
<tr><td>

[isCategorySpecific](./Procedure.isCategorySpecific.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether this procedure is category-specific

</td></tr>
<tr><td>

[entity](./Procedure.entity.md)

</td><td>

`readonly`

</td><td>

[IProcedureEntity](../interfaces/IProcedureEntity.md)

</td><td>

Gets the underlying procedure data entity

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

[create(context, id, procedure)](./Procedure.create.md)

</td><td>

`static`

</td><td>

Factory method for creating a Procedure.

</td></tr>
<tr><td>

[getSteps()](./Procedure.getSteps.md)

</td><td>



</td><td>

Gets the procedure steps with fully materialized runtime tasks.

</td></tr>
<tr><td>

[render(renderContext)](./Procedure.render.md)

</td><td>



</td><td>

Renders the procedure with the given context.

</td></tr>
</tbody></table>
