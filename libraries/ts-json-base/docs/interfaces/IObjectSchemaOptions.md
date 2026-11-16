[Home](../README.md) > IObjectSchemaOptions

# Interface: IObjectSchemaOptions

Options for the `object` factory.

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

[additionalProperties](./IObjectSchemaOptions.additionalProperties.md)

</td><td>



</td><td>

boolean

</td><td>

Whether the object is open to properties it does not declare.

</td></tr>
<tr><td>

[description](./ISchemaOptions.description.md)

</td><td>



</td><td>

string

</td><td>

Optional human-readable description emitted into the wire JSON Schema.

</td></tr>
<tr><td>

[nullable](./ISchemaOptions.nullable.md)

</td><td>



</td><td>

boolean

</td><td>

When `true`, the value may also be `null`: the derived static type widens to

</td></tr>
<tr><td>

[title](./ISchemaOptions.title.md)

</td><td>



</td><td>

string

</td><td>

A short title for the value, emitted as the JSON Schema `title` annotation.

</td></tr>
<tr><td>

[default](./ISchemaOptions.default.md)

</td><td>



</td><td>

[JsonValue](../type-aliases/JsonValue.md)

</td><td>

The value a consumer should assume when none is supplied, emitted as the JSON Schema

</td></tr>
<tr><td>

[examples](./ISchemaOptions.examples.md)

</td><td>



</td><td>

readonly [JsonValue](../type-aliases/JsonValue.md)[]

</td><td>

Example values, emitted as the JSON Schema `examples` annotation.

</td></tr>
</tbody></table>
