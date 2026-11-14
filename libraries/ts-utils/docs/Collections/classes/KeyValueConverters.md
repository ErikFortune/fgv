[Home](../../README.md) > [Collections](../README.md) > KeyValueConverters

# Class: KeyValueConverters

Helper class for converting strongly-typed keys, values, or entries
from unknown values.

## Constructors

<table><thead><tr><th>

Constructor

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

`constructor(params)`

</td><td>



</td><td>

Constructs a new key-value validator.

</td></tr>
</tbody></table>

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

[key](./KeyValueConverters.key.md)

</td><td>

`readonly`

</td><td>

[Validator](../../interfaces/Validator.md)&lt;TK, unknown&gt; | [Converter](../../interfaces/Converter.md)&lt;TK, unknown&gt;

</td><td>

Required key Validator | validator or Converter | converter.

</td></tr>
<tr><td>

[value](./KeyValueConverters.value.md)

</td><td>

`readonly`

</td><td>

[Validator](../../interfaces/Validator.md)&lt;TV, unknown&gt; | [Converter](../../interfaces/Converter.md)&lt;TV, unknown&gt;

</td><td>

Required value Validator | validator or Converter | converter.

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[convertKey(key)](./KeyValueConverters.convertKey.md)

</td><td>



</td><td>

Converts a supplied unknown to a valid key value of type `<TK>`.

</td></tr>
<tr><td>

[convertValue(key)](./KeyValueConverters.convertValue.md)

</td><td>



</td><td>

Converts a supplied unknown to a valid value of type `<TV>`.

</td></tr>
<tr><td>

[convertEntry(entry)](./KeyValueConverters.convertEntry.md)

</td><td>



</td><td>

Converts a supplied unknown to a valid entry of type `[<TK>, <TV>]`.

</td></tr>
<tr><td>

[convertEntries(entries)](./KeyValueConverters.convertEntries.md)

</td><td>



</td><td>

Converts a supplied iterable of unknowns to valid key-value pairs.

</td></tr>
</tbody></table>
