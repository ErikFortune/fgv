[Home](../../README.md) > [JsonSchema](../README.md) > ValidatedStringOptions

# Class: ValidatedStringOptions

Options that `stringOptions` has found coherent, which the
`string` factory accepts. The options are held privately as a frozen copy, read through
`options`.

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

[kind](./ValidatedStringOptions.kind.md)

</td><td>

`readonly`

</td><td>

"validated-string-options"

</td><td>

Discriminates validated options from plain ones, which declare `kind` as `never`.

</td></tr>
<tr><td>

[options](./ValidatedStringOptions.options.md)

</td><td>

`readonly`

</td><td>

Readonly&lt;T&gt;

</td><td>

The validated options: a frozen copy of those `stringOptions` was given.

</td></tr>
</tbody></table>
