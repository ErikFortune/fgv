[Home](../README.md) > INumberSchemaOptions

# Interface: INumberSchemaOptions

Options for the `number` and `integer` factories.

**Extends:** [`ISchemaOptions`](ISchemaOptions.md)

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

[strict](./INumberSchemaOptions.strict.md)

</td><td>



</td><td>

boolean

</td><td>

When `true` (default), the derived validator rejects numeric strings such as `'42'` and
accepts only genuine JSON numbers.

</td></tr>
<tr><td>

[description](./ISchemaOptions.description.md)

</td><td>



</td><td>

string

</td><td>

Optional human-readable description emitted into the wire JSON Schema.

</td></tr>
</tbody></table>
