[Home](../../README.md) > [Collections](../README.md) > CollectorValidator

# Class: CollectorValidator

A Collections.Collector | Collector wrapper which validates weakly-typed keys
and values before calling the wrapped collector.

**Implements:** [`IReadOnlyCollectorValidator<TITEM>`](../../interfaces/IReadOnlyCollectorValidator.md)

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

[converters](./CollectorValidator.converters.md)

</td><td>

`readonly`

</td><td>

[KeyValueConverters](../../classes/KeyValueConverters.md)&lt;[CollectibleKey](../../type-aliases/CollectibleKey.md)&lt;TITEM&gt;, TITEM&gt;

</td><td>



</td></tr>
<tr><td>

[map](./CollectorValidator.map.md)

</td><td>

`readonly`

</td><td>

[IReadOnlyResultMap](../../interfaces/IReadOnlyResultMap.md)&lt;[CollectibleKey](../../type-aliases/CollectibleKey.md)&lt;TITEM&gt;, TITEM&gt;

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

[add(item)](./CollectorValidator.add.md)

</td><td>



</td><td>

Adds an item to the collection, failing if a different item with the same key already exists.

</td></tr>
<tr><td>

[get(key)](./CollectorValidator.get.md)

</td><td>



</td><td>

Gets a value by key.

</td></tr>
<tr><td>

[getOrAdd(key, factory)](./CollectorValidator.getOrAdd.md)

</td><td>



</td><td>

Gets an existing item with a key matching the supplied key, or adds a new item to the collector

</td></tr>
<tr><td>

[has(key)](./CollectorValidator.has.md)

</td><td>



</td><td>

Returns `true` if the map contains a key.

</td></tr>
<tr><td>

[toReadOnly()](./CollectorValidator.toReadOnly.md)

</td><td>



</td><td>

Gets a read-only version of this collector.

</td></tr>
</tbody></table>
