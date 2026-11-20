[Home](../README.md) > Collector

# Class: Collector

A Collections.Collector | Collector that is a specialized collection
which contains items of type Collections.ICollectible | ICollectible,
which have a unique key and a write-once index.

Items are assigned an index sequentially as they are added to the collection.
Once added, items are immutable - they cannot be removed or replaced.

**Implements:** [`IReadOnlyCollector<TITEM>`](../interfaces/IReadOnlyCollector.md)

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

Constructs a new Collections.Collector | Collector.

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

[createCollector(params)](./Collector.createCollector.md)

</td><td>

`static`

</td><td>

Creates a new Collections.Collector | Collector instance.

</td></tr>
<tr><td>

[add(item)](./Collector.add.md)

</td><td>



</td><td>

Adds an item to the collection, failing if a different item with the same key already exists.

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

[getOrAdd(item)](./Collector.getOrAdd.md)

</td><td>



</td><td>

Gets an existing item with a key matching that of a supplied item, or adds the supplied

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
