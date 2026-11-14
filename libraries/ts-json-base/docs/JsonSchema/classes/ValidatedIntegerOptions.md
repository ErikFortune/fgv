[Home](../../README.md) > [JsonSchema](../README.md) > ValidatedIntegerOptions

# Class: ValidatedIntegerOptions

Options that `integerOptions` has found coherent for an
integer node — in particular, its range holds at least one integer. Accepted by both the
`integer` and the `number` factory.

**Extends:** [`ValidatedNumberOptions<T>`](../../classes/ValidatedNumberOptions.md)

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

[holdsInteger](./ValidatedIntegerOptions.holdsInteger.md)

</td><td>

`readonly`

</td><td>

true

</td><td>

Always `true`: the range holds at least one integer.

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
