[Home](../README.md) > ImportContext

# Class: ImportContext

Class to accumulate context for a resource import operation.

**Implements:** [`IValidatedImportContext`](../interfaces/IValidatedImportContext.md)

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

[baseId](./ImportContext.baseId.md)

</td><td>

`readonly`

</td><td>

[ResourceId](../type-aliases/ResourceId.md) | undefined

</td><td>

Base ID for the import context for resources imported

</td></tr>
<tr><td>

[conditions](./ImportContext.conditions.md)

</td><td>

`readonly`

</td><td>

readonly [ILooseConditionDecl](../interfaces/ILooseConditionDecl.md)[]

</td><td>

Conditions to be applied to resources imported in this context.

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

[create(context)](./ImportContext.create.md)

</td><td>

`static`

</td><td>

Factory method to create a new Import.ImportContext | import context.

</td></tr>
<tr><td>

[forContainerImport(container, importer)](./ImportContext.forContainerImport.md)

</td><td>

`static`

</td><td>

Creates a new Import.ImportContext | import context to import resources from a

</td></tr>
<tr><td>

[withConditions(conditions)](./ImportContext.withConditions.md)

</td><td>



</td><td>

Adds conditions to the import context.

</td></tr>
<tr><td>

[withName(names)](./ImportContext.withName.md)

</td><td>



</td><td>

Appends names to the base ID of the import context.

</td></tr>
<tr><td>

[extend(context)](./ImportContext.extend.md)

</td><td>



</td><td>

Extends the import context with additional name segments and conditions.

</td></tr>
</tbody></table>
