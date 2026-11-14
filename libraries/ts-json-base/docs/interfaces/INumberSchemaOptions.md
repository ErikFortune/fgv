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

[minimum](./INumberSchemaOptions.minimum.md)

</td><td>



</td><td>

number

</td><td>

The value must be greater than or equal to this.

</td></tr>
<tr><td>

[maximum](./INumberSchemaOptions.maximum.md)

</td><td>



</td><td>

number

</td><td>

The value must be less than or equal to this.

</td></tr>
<tr><td>

[exclusiveMinimum](./INumberSchemaOptions.exclusiveMinimum.md)

</td><td>



</td><td>

number

</td><td>

The value must be strictly greater than this — the numeric form used by draft-06 and later,

</td></tr>
<tr><td>

[exclusiveMaximum](./INumberSchemaOptions.exclusiveMaximum.md)

</td><td>



</td><td>

number

</td><td>

The value must be strictly less than this, in the numeric form.

</td></tr>
<tr><td>

[multipleOf](./INumberSchemaOptions.multipleOf.md)

</td><td>



</td><td>

number

</td><td>

The value must be a multiple of this, which must be greater than zero.

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
