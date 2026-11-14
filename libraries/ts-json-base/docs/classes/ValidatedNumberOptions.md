[Home](../README.md) > ValidatedNumberOptions

# Class: ValidatedNumberOptions

Options that `numberOptions` or
`integerOptions` has found coherent, which the `number`
factory accepts.

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

[kind](./ValidatedNumberOptions.kind.md)

</td><td>

`readonly`

</td><td>

"validated-number-options"

</td><td>

Discriminates validated options from plain ones, which declare `kind` as `never`.

</td></tr>
<tr><td>

[options](./ValidatedNumberOptions.options.md)

</td><td>

`readonly`

</td><td>

Readonly&lt;T&gt;

</td><td>

The validated options: a frozen copy of those the check was given.

</td></tr>
</tbody></table>
