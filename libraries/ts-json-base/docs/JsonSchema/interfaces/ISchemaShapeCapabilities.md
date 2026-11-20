[Home](../../README.md) > [JsonSchema](../README.md) > ISchemaShapeCapabilities

# Interface: ISchemaShapeCapabilities

What a wire format does with the two schema shapes whose support varies independently of any
keyword: an `enum` whose members are not strings, and a schema with no `type`.

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

[nonStringEnum](./ISchemaShapeCapabilities.nonStringEnum.md)

</td><td>

`readonly`

</td><td>

"pass" | "fold"

</td><td>

What the wire does with an `enum` holding a number or a boolean.

</td></tr>
<tr><td>

[untyped](./ISchemaShapeCapabilities.untyped.md)

</td><td>

`readonly`

</td><td>

[SchemaUntypedRule](../../type-aliases/SchemaUntypedRule.md)

</td><td>

What the wire does with a schema that states no `type`.

</td></tr>
</tbody></table>
