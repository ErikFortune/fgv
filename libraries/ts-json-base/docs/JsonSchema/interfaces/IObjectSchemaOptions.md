[Home](../../README.md) > [JsonSchema](../README.md) > IObjectSchemaOptions

# Interface: IObjectSchemaOptions

Options for the `object` factory.

**Extends:** [`ISchemaOptions`](../../interfaces/ISchemaOptions.md)

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

[additionalProperties](./IObjectSchemaOptions.additionalProperties.md)

</td><td>



</td><td>

boolean

</td><td>

When `false` (default), the validator rejects unrecognized properties and the emitted schema
sets `additionalProperties: false`.

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
