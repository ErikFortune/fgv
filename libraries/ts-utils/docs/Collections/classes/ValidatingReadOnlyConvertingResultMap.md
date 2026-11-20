[Home](../../README.md) > [Collections](../README.md) > ValidatingReadOnlyConvertingResultMap

# Class: ValidatingReadOnlyConvertingResultMap

A read-only result map that wraps an inner Collections.IReadOnlyResultMap | IReadOnlyResultMap
of source type and returns lazily-converted, cached values of a target type, with a
Collections.ReadOnlyResultMapValidator | validating property for weakly-typed access.

**Extends:** [`ReadOnlyConvertingResultMap<TK, TSRC, TTARGET>`](../../classes/ReadOnlyConvertingResultMap.md)

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

Constructs a new Collections.ValidatingReadOnlyConvertingResultMap | ValidatingReadOnlyConvertingResultMap.

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

[validating](./ValidatingReadOnlyConvertingResultMap.validating.md)

</td><td>

`readonly`

</td><td>

[ReadOnlyResultMapValidator](../../classes/ReadOnlyResultMapValidator.md)&lt;TK, TTARGET&gt;

</td><td>

A validator for weakly-typed access to the map.

</td></tr>
<tr><td>

[size](./ReadOnlyConvertingResultMap.size.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

The number of entries in the map.

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

[create(params)](./ValidatingReadOnlyConvertingResultMap.create.md)

</td><td>

`static`

</td><td>

Creates a new Collections.ValidatingReadOnlyConvertingResultMap | ValidatingReadOnlyConvertingResultMap.

</td></tr>
<tr><td>

[get(key)](./ReadOnlyConvertingResultMap.get.md)

</td><td>



</td><td>

Gets a converted value from the map by key.

</td></tr>
<tr><td>

[has(key)](./ReadOnlyConvertingResultMap.has.md)

</td><td>



</td><td>

Checks if the map contains a key.

</td></tr>
<tr><td>

[entries()](./ReadOnlyConvertingResultMap.entries.md)

</td><td>



</td><td>

Returns an iterator over the map entries with converted values.

</td></tr>
<tr><td>

[keys()](./ReadOnlyConvertingResultMap.keys.md)

</td><td>



</td><td>

Returns an iterator over the map keys.

</td></tr>
<tr><td>

[values()](./ReadOnlyConvertingResultMap.values.md)

</td><td>



</td><td>

Returns an iterator over the converted map values.

</td></tr>
<tr><td>

[forEach(cb, thisArg)](./ReadOnlyConvertingResultMap.forEach.md)

</td><td>



</td><td>

Calls a callback for each entry in the map with converted values.

</td></tr>
<tr><td>

[toReadOnly()](./ReadOnlyConvertingResultMap.toReadOnly.md)

</td><td>



</td><td>

Gets a read-only version of this map.

</td></tr>
<tr><td>

[[iterator]()](./ReadOnlyConvertingResultMap._iterator_.md)

</td><td>



</td><td>

Gets an iterator over the map entries.

</td></tr>
</tbody></table>
