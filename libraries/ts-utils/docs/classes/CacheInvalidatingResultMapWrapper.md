[Home](../README.md) > CacheInvalidatingResultMapWrapper

# Class: CacheInvalidatingResultMapWrapper

A wrapper around a mutable result map that invalidates cache entries
in the parent Collections.ConvertingResultMap | ConvertingResultMap when mutations occur.

**Implements:** [`IResultMap<TK, TSRC>`](../interfaces/IResultMap.md)

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

`constructor(inner, parent)`

</td><td>



</td><td>

Constructs a new cache-invalidating wrapper.

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

[size](./CacheInvalidatingResultMapWrapper.size.md)

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

[add(key, value)](./CacheInvalidatingResultMapWrapper.add.md)

</td><td>



</td><td>

Adds a key/value pair to the map if the key does not already exist.

</td></tr>
<tr><td>

[set(key, value)](./CacheInvalidatingResultMapWrapper.set.md)

</td><td>



</td><td>

Sets a key/value pair in the map.

</td></tr>
<tr><td>

[update(key, value)](./CacheInvalidatingResultMapWrapper.update.md)

</td><td>



</td><td>

Updates an existing key in the map.

</td></tr>
<tr><td>

[delete(key)](./CacheInvalidatingResultMapWrapper.delete.md)

</td><td>



</td><td>

Deletes a key from the map.

</td></tr>
<tr><td>

[get(key)](./CacheInvalidatingResultMapWrapper.get.md)

</td><td>



</td><td>

Gets a value from the map.

</td></tr>
<tr><td>

[getOrAdd(key, value)](./CacheInvalidatingResultMapWrapper.getOrAdd.md)

</td><td>



</td><td>

Gets a value from the map, or adds a supplied value if it does not exist.

</td></tr>
<tr><td>

[has(key)](./CacheInvalidatingResultMapWrapper.has.md)

</td><td>



</td><td>

Checks if the map contains a key.

</td></tr>
<tr><td>

[clear()](./CacheInvalidatingResultMapWrapper.clear.md)

</td><td>



</td><td>

Clears all entries from the map.

</td></tr>
<tr><td>

[entries()](./CacheInvalidatingResultMapWrapper.entries.md)

</td><td>



</td><td>

Returns an iterator over the map entries.

</td></tr>
<tr><td>

[keys()](./CacheInvalidatingResultMapWrapper.keys.md)

</td><td>



</td><td>

Returns an iterator over the map keys.

</td></tr>
<tr><td>

[values()](./CacheInvalidatingResultMapWrapper.values.md)

</td><td>



</td><td>

Returns an iterator over the map values.

</td></tr>
<tr><td>

[forEach(cb, thisArg)](./CacheInvalidatingResultMapWrapper.forEach.md)

</td><td>



</td><td>

Calls a callback for each entry in the map.

</td></tr>
<tr><td>

[toReadOnly()](./CacheInvalidatingResultMapWrapper.toReadOnly.md)

</td><td>



</td><td>

Gets a read-only version of this map.

</td></tr>
<tr><td>

[[iterator]()](./CacheInvalidatingResultMapWrapper._iterator_.md)

</td><td>



</td><td>

Gets an iterator over the map entries.

</td></tr>
</tbody></table>
