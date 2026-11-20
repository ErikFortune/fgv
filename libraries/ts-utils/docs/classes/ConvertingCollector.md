[Home](../README.md) > ConvertingCollector

# Class: ConvertingCollector

A Collector | collector that collects Collections.ICollectible | ICollectible items,
optionally converting them from a source representation to the target representation using a factory
supplied at default or at the time of collection.

**Extends:** [`Collector<TITEM>`](Collector.md)

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

Constructs a new Collections.ConvertingCollector | ConvertingCollector.

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

[size](./Collector.size.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Returns the number of entries in the map.

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

[createConvertingCollector(params)](./ConvertingCollector.createConvertingCollector.md)

</td><td>

`static`

</td><td>

Creates a new Collections.ConvertingCollector | ConvertingCollector.

</td></tr>
<tr><td>

[createCollector(params)](./Collector.createCollector.md)

</td><td>

`static`

</td><td>

Creates a new Collections.Collector | Collector instance.

</td></tr>
<tr><td>

[add(item)](./ConvertingCollector.add.md)

</td><td>



</td><td>

Adds an item to the collection, failing if a different item with the same key already exists.

</td></tr>
<tr><td>

[getOrAdd(item)](./ConvertingCollector.getOrAdd.md)

</td><td>



</td><td>

Gets an existing item with a key matching that of the supplied item, or adds the supplied

</td></tr>
<tr><td>

[_isFactoryCB(itemOrCb)](./ConvertingCollector._isFactoryCB.md)

</td><td>



</td><td>

Helper method for derived classes to determine if a supplied

</td></tr>
<tr><td>

[_overloadIsItem(keyOrItem, itemOrCb)](./ConvertingCollector._overloadIsItem.md)

</td><td>



</td><td>

Helper method for derived classes to determine if a supplied

</td></tr>
<tr><td>

[_buildItem(key, itemOrCb)](./ConvertingCollector._buildItem.md)

</td><td>



</td><td>

Helper method for derived classes to build an item from a key and a source representation using

</td></tr>
<tr><td>

[entries()](./Collector.entries.md)

</td><td>



</td><td>

Returns an iterator over the map entries.

</td></tr>
<tr><td>

[forEach(callback, arg)](./Collector.forEach.md)

</td><td>



</td><td>

Calls a function for each entry in the map.

</td></tr>
<tr><td>

[get(key)](./Collector.get.md)

</td><td>



</td><td>

Gets a value by key.

</td></tr>
<tr><td>

[getAt(index)](./Collector.getAt.md)

</td><td>



</td><td>

Gets the item at a specified index.

</td></tr>
<tr><td>

[has(key)](./Collector.has.md)

</td><td>



</td><td>

Returns true if the map contains an entry with the given key.

</td></tr>
<tr><td>

[keys()](./Collector.keys.md)

</td><td>



</td><td>

Returns an iterator over the map keys.

</td></tr>
<tr><td>

[values()](./Collector.values.md)

</td><td>



</td><td>

Returns an iterator over the map values.

</td></tr>
<tr><td>

[valuesByIndex()](./Collector.valuesByIndex.md)

</td><td>



</td><td>

Gets all items in the collection, ordered by index.

</td></tr>
<tr><td>

[toReadOnly()](./Collector.toReadOnly.md)

</td><td>



</td><td>

Gets a read-only version of this collector.

</td></tr>
<tr><td>

[[iterator]()](./Collector._iterator_.md)

</td><td>



</td><td>

Gets an iterator over the map entries.

</td></tr>
</tbody></table>
