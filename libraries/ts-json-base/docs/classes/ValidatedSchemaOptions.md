[Home](../README.md) > ValidatedSchemaOptions

# Class: ValidatedSchemaOptions

Options whose annotations `schemaOptions` has checked: `default`
and every member of `examples` are JSON values.

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

[kind](./ValidatedSchemaOptions.kind.md)

</td><td>

`readonly`

</td><td>

"validated-schema-options"

</td><td>

Discriminates validated options from plain ones, which declare `kind` as `never`.

</td></tr>
<tr><td>

[options](./ValidatedSchemaOptions.options.md)

</td><td>

`readonly`

</td><td>

Readonly&lt;T&gt;

</td><td>

The validated options: a frozen copy of those `schemaOptions` was given.

</td></tr>
</tbody></table>
