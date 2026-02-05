[Home](../README.md) > IResolvedConfectionProcedure

# Interface: IResolvedConfectionProcedure

Resolved procedure reference for confections.
Similar to IResolvedFillingRecipeProcedure but for confections.

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

[id](./IResolvedConfectionProcedure.id.md)

</td><td>

`readonly`

</td><td>

[ProcedureId](../type-aliases/ProcedureId.md)

</td><td>

The procedure ID (for IOptionsWithPreferred compatibility)

</td></tr>
<tr><td>

[procedure](./IResolvedConfectionProcedure.procedure.md)

</td><td>

`readonly`

</td><td>

[IProcedure](IProcedure.md)

</td><td>

The resolved procedure object

</td></tr>
<tr><td>

[notes](./IResolvedConfectionProcedure.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](ICategorizedNote.md)[]

</td><td>

Optional notes specific to using this procedure

</td></tr>
<tr><td>

[entity](./IResolvedConfectionProcedure.entity.md)

</td><td>

`readonly`

</td><td>

[IProcedureRefEntity](../type-aliases/IProcedureRefEntity.md)

</td><td>

The original procedure reference entity data

</td></tr>
</tbody></table>
