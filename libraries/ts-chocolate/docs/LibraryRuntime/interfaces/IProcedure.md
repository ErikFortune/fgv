[Home](../../README.md) > [LibraryRuntime](../README.md) > IProcedure

# Interface: IProcedure

A resolved runtime view of a procedure with rendering capabilities.

This interface provides runtime-layer access to procedure data with:
- Composite identity (`id`, `collectionId`) for cross-source references
- Proper task resolution (not placeholders)
- Computed timing properties

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

[id](./IProcedure.id.md)

</td><td>

`readonly`

</td><td>

[ProcedureId](../../type-aliases/ProcedureId.md)

</td><td>

The composite procedure ID (e.g., "common.ganache-basic").

</td></tr>
<tr><td>

[baseId](./IProcedure.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseProcedureId](../../type-aliases/BaseProcedureId.md)

</td><td>

The base procedure ID within the source.

</td></tr>
<tr><td>

[name](./IProcedure.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Human-readable name

</td></tr>
<tr><td>

[description](./IProcedure.description.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional description

</td></tr>
<tr><td>

[category](./IProcedure.category.md)

</td><td>

`readonly`

</td><td>

[ProcedureType](../../type-aliases/ProcedureType.md)

</td><td>

Optional category this procedure applies to

</td></tr>
<tr><td>

[steps](./IProcedure.steps.md)

</td><td>

`readonly`

</td><td>

readonly [IResolvedProcedureStep](../../interfaces/IResolvedProcedureStep.md)[]

</td><td>

Steps of the procedure in order, with resolved task references

</td></tr>
<tr><td>

[tags](./IProcedure.tags.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Optional tags

</td></tr>
<tr><td>

[notes](./IProcedure.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[]

</td><td>

Optional categorized notes

</td></tr>
<tr><td>

[totalActiveTime](./IProcedure.totalActiveTime.md)

</td><td>

`readonly`

</td><td>

[Minutes](../../type-aliases/Minutes.md) | undefined

</td><td>

Total active time for all steps

</td></tr>
<tr><td>

[totalWaitTime](./IProcedure.totalWaitTime.md)

</td><td>

`readonly`

</td><td>

[Minutes](../../type-aliases/Minutes.md) | undefined

</td><td>

Total wait time for all steps

</td></tr>
<tr><td>

[totalHoldTime](./IProcedure.totalHoldTime.md)

</td><td>

`readonly`

</td><td>

[Minutes](../../type-aliases/Minutes.md) | undefined

</td><td>

Total hold time for all steps

</td></tr>
<tr><td>

[totalTime](./IProcedure.totalTime.md)

</td><td>

`readonly`

</td><td>

[Minutes](../../type-aliases/Minutes.md) | undefined

</td><td>

Total time (active + wait + hold)

</td></tr>
<tr><td>

[stepCount](./IProcedure.stepCount.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Number of steps

</td></tr>
<tr><td>

[isCategorySpecific](./IProcedure.isCategorySpecific.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether this procedure is category-specific

</td></tr>
<tr><td>

[entity](./IProcedure.entity.md)

</td><td>

`readonly`

</td><td>

[IProcedureEntity](../../interfaces/IProcedureEntity.md)

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

[render(context)](./IProcedure.render.md)

</td><td>



</td><td>

Renders the procedure with the given context.

</td></tr>
</tbody></table>
