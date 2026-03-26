[Home](../../README.md) > [Import](../README.md) > IValidatedImportContext

# Interface: IValidatedImportContext

Accumulated context of a resource import operation.

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

[baseId](./IValidatedImportContext.baseId.md)

</td><td>

`readonly`

</td><td>

[ResourceId](../../type-aliases/ResourceId.md)

</td><td>

Base ID for the import context for resources imported

</td></tr>
<tr><td>

[conditions](./IValidatedImportContext.conditions.md)

</td><td>

`readonly`

</td><td>

readonly [ILooseConditionDecl](../../interfaces/ILooseConditionDecl.md)[]

</td><td>

Conditions to be applied to resources imported in this context.

</td></tr>
</tbody></table>
