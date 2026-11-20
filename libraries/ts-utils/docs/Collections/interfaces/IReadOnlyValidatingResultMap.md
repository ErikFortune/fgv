[Home](../../README.md) > [Collections](../README.md) > IReadOnlyValidatingResultMap

# Interface: IReadOnlyValidatingResultMap

A read-only interface exposing non-mutating methods of a Collections.ValidatingResultMap | ValidatingResultMap.

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

[validating](./IReadOnlyValidatingResultMap.validating.md)

</td><td>

`readonly`

</td><td>

[IReadOnlyResultMapValidator](../../interfaces/IReadOnlyResultMapValidator.md)&lt;TK, TV&gt;

</td><td>

A Collections.ResultMapValidator | ResultMapValidator which validates keys and values

</td></tr>
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
