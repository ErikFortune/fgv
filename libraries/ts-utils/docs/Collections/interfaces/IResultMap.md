[Home](../../README.md) > [Collections](../README.md) > IResultMap

# Interface: IResultMap

Interface for a mutable Collections.ResultMap | ResultMap.

**Extends:** [`IReadOnlyResultMap<TK, TV>`](../../interfaces/IReadOnlyResultMap.md)

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

[size](./IResultMap.size.md)

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

[add(key, value)](./IResultMap.add.md)

</td><td>



</td><td>

Sets a key/value pair in the map if the key does not already exist.

</td></tr>
<tr><td>

[set(key, value)](./IResultMap.set.md)

</td><td>



</td><td>

Sets a key/value pair in the map regardless of whether the key already exists.

</td></tr>
<tr><td>

[update(key, value)](./IResultMap.update.md)

</td><td>



</td><td>

Updates the value associated with a key in the map.

</td></tr>
<tr><td>

[delete(key)](./IResultMap.delete.md)

</td><td>



</td><td>

Deletes a key from the map.

</td></tr>
<tr><td>

[get(key)](./IResultMap.get.md)

</td><td>



</td><td>

Gets a value from the map.

</td></tr>
<tr><td>

[getOrAdd(key, value)](./IResultMap.getOrAdd.md)

</td><td>



</td><td>

Gets a value from the map, or adds a supplied value if it does not exist.

</td></tr>
<tr><td>

[entries()](./IResultMap.entries.md)

</td><td>



</td><td>

Returns an iterator over the map entries.

</td></tr>
<tr><td>

[keys()](./IResultMap.keys.md)

</td><td>



</td><td>

Returns an iterator over the map keys.

</td></tr>
<tr><td>

[values()](./IResultMap.values.md)

</td><td>



</td><td>

Returns an iterator over the map values.

</td></tr>
<tr><td>

[forEach(cb, arg)](./IResultMap.forEach.md)

</td><td>



</td><td>

Calls a function for each entry in the map.

</td></tr>
<tr><td>

[clear()](./IResultMap.clear.md)

</td><td>



</td><td>

Clears all entries from the map.

</td></tr>
<tr><td>

[toReadOnly()](./IResultMap.toReadOnly.md)

</td><td>



</td><td>

Gets a readonly version of this map.

</td></tr>
<tr><td>

[has(key)](./IReadOnlyResultMap.has.md)

</td><td>



</td><td>

Returns `true` if the map contains a key.

</td></tr>
<tr><td>

[[iterator]()](./IReadOnlyResultMap._iterator_.md)

</td><td>



</td><td>

Gets an iterator over the map entries.

</td></tr>
</tbody></table>
