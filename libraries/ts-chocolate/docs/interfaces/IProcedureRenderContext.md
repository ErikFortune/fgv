[Home](../README.md) > IProcedureRenderContext

# Interface: IProcedureRenderContext

Context for rendering a procedure with full library access.

Unlike the data-layer IProcedureRenderContext (which uses `unknown` for library),
this interface has properly typed library access for task resolution.

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

[context](./IProcedureRenderContext.context.md)

</td><td>

`readonly`

</td><td>

IProcedureContext

</td><td>

The procedure context for task resolution.

</td></tr>
<tr><td>

[recipe](./IProcedureRenderContext.recipe.md)

</td><td>

`readonly`

</td><td>

[IProducedFillingEntity](IProducedFillingEntity.md)

</td><td>

The specific produced filling this procedure is being rendered for

</td></tr>
<tr><td>

[mold](./IProcedureRenderContext.mold.md)

</td><td>

`readonly`

</td><td>

[IMoldEntity](IMoldEntity.md)

</td><td>

Optional mold being used for this recipe

</td></tr>
</tbody></table>
