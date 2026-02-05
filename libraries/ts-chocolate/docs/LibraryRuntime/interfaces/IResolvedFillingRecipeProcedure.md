[Home](../../README.md) > [LibraryRuntime](../README.md) > IResolvedFillingRecipeProcedure

# Interface: IResolvedFillingRecipeProcedure

A resolved procedure reference with the full procedure object.
Used in runtime recipes to provide direct access to procedure details.

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

[id](./IResolvedFillingRecipeProcedure.id.md)

</td><td>

`readonly`

</td><td>

[ProcedureId](../../type-aliases/ProcedureId.md)

</td><td>

The procedure ID (for consistency with IResolvedConfectionProcedure).

</td></tr>
<tr><td>

[procedure](./IResolvedFillingRecipeProcedure.procedure.md)

</td><td>

`readonly`

</td><td>

[IProcedureEntity](../../interfaces/IProcedureEntity.md)

</td><td>

The fully resolved procedure object.

</td></tr>
<tr><td>

[notes](./IResolvedFillingRecipeProcedure.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[]

</td><td>

Optional notes specific to using this procedure with the recipe.

</td></tr>
<tr><td>

[entity](./IResolvedFillingRecipeProcedure.entity.md)

</td><td>

`readonly`

</td><td>

[IProcedureRefEntity](../../type-aliases/IProcedureRefEntity.md)

</td><td>

The original procedure reference entity data.

</td></tr>
</tbody></table>
