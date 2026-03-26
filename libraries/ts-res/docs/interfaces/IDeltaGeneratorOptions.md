[Home](../README.md) > IDeltaGeneratorOptions

# Interface: IDeltaGeneratorOptions

Interface for options controlling delta generation behavior.

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

[context](./IDeltaGeneratorOptions.context.md)

</td><td>



</td><td>

[IContextDecl](../type-aliases/IContextDecl.md)

</td><td>

Context to use when resolving resources.

</td></tr>
<tr><td>

[resourceIds](./IDeltaGeneratorOptions.resourceIds.md)

</td><td>



</td><td>

readonly string[]

</td><td>

Array of specific resource IDs to include in delta generation.

</td></tr>
<tr><td>

[skipUnchanged](./IDeltaGeneratorOptions.skipUnchanged.md)

</td><td>



</td><td>

boolean

</td><td>

Whether to skip resources that haven't changed.

</td></tr>
</tbody></table>
