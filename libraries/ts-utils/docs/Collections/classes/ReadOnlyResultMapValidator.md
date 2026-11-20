[Home](../../README.md) > [Collections](../README.md) > ReadOnlyResultMapValidator

# Class: ReadOnlyResultMapValidator

A read-only validator for any Collections.IReadOnlyResultMap | IReadOnlyResultMap
that validates weakly-typed keys before accessing values.

**Implements:** [`IReadOnlyResultMapValidator<TK, TV>`](../../interfaces/IReadOnlyResultMapValidator.md)

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

`constructor(map, converters)`

</td><td>



</td><td>

Constructs a new Collections.ReadOnlyResultMapValidator | ReadOnlyResultMapValidator.

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

[converters](./ReadOnlyResultMapValidator.converters.md)

</td><td>

`readonly`

</td><td>

[KeyValueConverters](../../classes/KeyValueConverters.md)&lt;TK, TV&gt;

</td><td>

The key-value converters used for validation.

</td></tr>
<tr><td>

[map](./ReadOnlyResultMapValidator.map.md)

</td><td>

`readonly`

</td><td>

[IReadOnlyResultMap](../../interfaces/IReadOnlyResultMap.md)&lt;TK, TV&gt;

</td><td>

The underlying map.

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

[get(key)](./ReadOnlyResultMapValidator.get.md)

</td><td>



</td><td>

Gets a value from the map by key, validating the key first.

</td></tr>
<tr><td>

[has(key)](./ReadOnlyResultMapValidator.has.md)

</td><td>



</td><td>

Checks if the map contains a key, validating the key first.

</td></tr>
</tbody></table>
