[Home](../README.md) > ConvertingCollectorValidator

# Class: ConvertingCollectorValidator

A Collections.ConvertingCollector | ConvertingCollector wrapper which validates weakly-typed keys
and values before calling the wrapped collector.  Unlike the basic Collections.CollectorValidator | CollectorValidator,
the converting collector expects the items to be in the source type of the converting collector, not the target type.

**Implements:** [`IReadOnlyCollectorValidator<TITEM>`](../interfaces/IReadOnlyCollectorValidator.md)

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

Constructs a new Collections.ConvertingCollectorValidator | ConvertingCollectorValidator.

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

[converters](./ConvertingCollectorValidator.converters.md)

</td><td>

`readonly`

</td><td>

[KeyValueConverters](KeyValueConverters.md)&lt;[CollectibleKey](../type-aliases/CollectibleKey.md)&lt;TITEM&gt;, TSRC&gt;

</td><td>



</td></tr>
<tr><td>

[map](./ConvertingCollectorValidator.map.md)

</td><td>

`readonly`

</td><td>

[IReadOnlyResultMap](../interfaces/IReadOnlyResultMap.md)&lt;[CollectibleKey](../type-aliases/CollectibleKey.md)&lt;TITEM&gt;, TITEM&gt;

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

[add(key, value)](./ConvertingCollectorValidator.add.md)

</td><td>



</td><td>

Adds an item to the collector using the default factory at a specified key,

</td></tr>
<tr><td>

[get(key)](./ConvertingCollectorValidator.get.md)

</td><td>



</td><td>

Gets a value by key.

</td></tr>
<tr><td>

[getOrAdd(key, value)](./ConvertingCollectorValidator.getOrAdd.md)

</td><td>



</td><td>

Gets an existing item with a key matching the supplied key, or adds a new item to the collector

</td></tr>
<tr><td>

[has(key)](./ConvertingCollectorValidator.has.md)

</td><td>



</td><td>

Returns `true` if the map contains a key.

</td></tr>
<tr><td>

[toReadOnly()](./ConvertingCollectorValidator.toReadOnly.md)

</td><td>



</td><td>

Gets a read-only version of this collector.

</td></tr>
<tr><td>

[_isCollectibleFactoryCallback(value)](./ConvertingCollectorValidator._isCollectibleFactoryCallback.md)

</td><td>



</td><td>

Determines if a value is a Collections.CollectibleFactoryCallback | CollectibleFactoryCallback.

</td></tr>
</tbody></table>
