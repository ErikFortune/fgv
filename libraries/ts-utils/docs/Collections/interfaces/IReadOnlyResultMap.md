[Home](../../README.md) > [Collections](../README.md) > IReadOnlyResultMap

# Interface: IReadOnlyResultMap

A readonly `ReadonlyMap<TK, TV>`-like object which reports success or failure
with additional details using the
https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils#the-result-pattern | result pattern.

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

[size](./IReadOnlyResultMap.size.md)

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

[entries()](./IReadOnlyResultMap.entries.md)

</td><td>



</td><td>

Returns an iterator over the map entries.

</td></tr>
<tr><td>

[forEach(cb, arg)](./IReadOnlyResultMap.forEach.md)

</td><td>



</td><td>

Calls a function for each entry in the map.

</td></tr>
<tr><td>

[get(key)](./IReadOnlyResultMap.get.md)

</td><td>



</td><td>

Gets a value from the map.

</td></tr>
<tr><td>

[has(key)](./IReadOnlyResultMap.has.md)

</td><td>



</td><td>

Returns `true` if the map contains a key.

</td></tr>
<tr><td>

[keys()](./IReadOnlyResultMap.keys.md)

</td><td>



</td><td>

Returns an iterator over the map keys.

</td></tr>
<tr><td>

[values()](./IReadOnlyResultMap.values.md)

</td><td>



</td><td>

Returns an iterator over the map values.

</td></tr>
<tr><td>

[[iterator]()](./IReadOnlyResultMap._iterator_.md)

</td><td>



</td><td>

Gets an iterator over the map entries.

</td></tr>
</tbody></table>
