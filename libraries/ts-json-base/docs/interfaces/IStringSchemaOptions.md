[Home](../README.md) > IStringSchemaOptions

# Interface: IStringSchemaOptions

Options for the `string` factory.

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

[minLength](./IStringSchemaOptions.minLength.md)

</td><td>



</td><td>

number

</td><td>

The string must have at least this many characters.

</td></tr>
<tr><td>

[maxLength](./IStringSchemaOptions.maxLength.md)

</td><td>



</td><td>

number

</td><td>

The string must have at most this many characters, counted in code points.

</td></tr>
<tr><td>

[pattern](./IStringSchemaOptions.pattern.md)

</td><td>



</td><td>

RegExp

</td><td>

A regular expression the string must match — the host's own, and therefore trusted.

</td></tr>
<tr><td>

[format](./IStringSchemaOptions.format.md)

</td><td>



</td><td>

string

</td><td>

A semantic format such as `'date-time'` or `'email'`, emitted as the JSON Schema `format`

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
