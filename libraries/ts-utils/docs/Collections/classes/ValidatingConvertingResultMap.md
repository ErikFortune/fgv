[Home](../../README.md) > [Collections](../README.md) > ValidatingConvertingResultMap

# Class: ValidatingConvertingResultMap

A result map that wraps an inner Collections.IResultMap | IResultMap of source type
and returns lazily-converted, cached values of a target type, with a
Collections.ReadOnlyResultMapValidator | validating property for weakly-typed access
and a Collections.CacheInvalidatingResultMapWrapper | source property for mutable access
to the underlying source map.

**Extends:** [`ConvertingResultMap<TK, TSRC, TTARGET, TSRCMAP>`](../../classes/ConvertingResultMap.md)

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

Constructs a new Collections.ValidatingConvertingResultMap | ValidatingConvertingResultMap.

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

[validating](./ValidatingConvertingResultMap.validating.md)

</td><td>

`readonly`

</td><td>

[ReadOnlyResultMapValidator](../../classes/ReadOnlyResultMapValidator.md)&lt;TK, TTARGET&gt;

</td><td>

A validator for weakly-typed access to the map.

</td></tr>
<tr><td>

[source](./ConvertingResultMap.source.md)

</td><td>

`readonly`

</td><td>

[CacheInvalidatingResultMapWrapper](../../classes/CacheInvalidatingResultMapWrapper.md)&lt;TK, TSRC, TTARGET, TSRCMAP&gt;

</td><td>

A wrapper around the inner map that invalidates cache entries when mutations occur.

</td></tr>
<tr><td>

[size](./ConvertingResultMap.size.md)

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

[create(params)](./ValidatingConvertingResultMap.create.md)

</td><td>

`static`

</td><td>

Creates a new Collections.ValidatingConvertingResultMap | ValidatingConvertingResultMap.

</td></tr>
<tr><td>

[get(key)](./ConvertingResultMap.get.md)

</td><td>



</td><td>

Gets a converted value from the map by key.

</td></tr>
<tr><td>

[has(key)](./ConvertingResultMap.has.md)

</td><td>



</td><td>

Checks if the map contains a key.

</td></tr>
<tr><td>

[entries()](./ConvertingResultMap.entries.md)

</td><td>



</td><td>

Returns an iterator over the map entries with converted values.

</td></tr>
<tr><td>

[keys()](./ConvertingResultMap.keys.md)

</td><td>



</td><td>

Returns an iterator over the map keys.

</td></tr>
<tr><td>

[values()](./ConvertingResultMap.values.md)

</td><td>



</td><td>

Returns an iterator over the converted map values.

</td></tr>
<tr><td>

[forEach(cb, thisArg)](./ConvertingResultMap.forEach.md)

</td><td>



</td><td>

Calls a callback for each entry in the map with converted values.

</td></tr>
<tr><td>

[toReadOnly()](./ConvertingResultMap.toReadOnly.md)

</td><td>



</td><td>

Gets a read-only version of this map.

</td></tr>
<tr><td>

[[iterator]()](./ConvertingResultMap._iterator_.md)

</td><td>



</td><td>

Gets an iterator over the map entries.

</td></tr>
</tbody></table>
