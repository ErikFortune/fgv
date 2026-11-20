[Home](../../README.md) > [Collections](../README.md) > ValidatingResultMap

# Class: ValidatingResultMap

A Collections.ResultMap | ResultMap with a Collections.ResultMapValidator | validator
property that enables validated use of the underlying map with weakly-typed keys and values.

**Extends:** [`ResultMap<TK, TV>`](../../classes/ResultMap.md)

**Implements:** [`IReadOnlyValidatingResultMap<TK, TV>`](../../interfaces/IReadOnlyValidatingResultMap.md)

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

Constructs a new Collections.ValidatingResultMap | ValidatingResultMap.

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

[validating](./ValidatingResultMap.validating.md)

</td><td>

`readonly`

</td><td>

[ResultMapValidator](../../classes/ResultMapValidator.md)&lt;TK, TV&gt;

</td><td>

A Collections.ResultMapValidator | ResultMapValidator which validates keys and values

</td></tr>
<tr><td>

[_inner](./ResultMap._inner.md)

</td><td>

`readonly`

</td><td>

Map&lt;TK, TV&gt;

</td><td>

Protected raw access to the inner `Map<TK, TV>` object.

</td></tr>
<tr><td>

[size](./ResultMap.size.md)

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

[createValidatingResultMap(params)](./ValidatingResultMap.createValidatingResultMap.md)

</td><td>

`static`

</td><td>

Creates a new Collections.ValidatingResultMap | ValidatingResultMap instance.

</td></tr>
<tr><td>

[create(elements)](./ResultMap.create.md)

</td><td>

`static`

</td><td>

Creates a new Collections.ResultMap | ResultMap.

</td></tr>
<tr><td>

[toReadOnly()](./ValidatingResultMap.toReadOnly.md)

</td><td>



</td><td>

Gets a read-only version of this map.

</td></tr>
<tr><td>

[add(key, value)](./ResultMap.add.md)

</td><td>



</td><td>

Sets a key/value pair in the map if the key does not already exist.

</td></tr>
<tr><td>

[clear()](./ResultMap.clear.md)

</td><td>



</td><td>

Clears the map.

</td></tr>
<tr><td>

[delete(key)](./ResultMap.delete.md)

</td><td>



</td><td>

Deletes a key from the map.

</td></tr>
<tr><td>

[entries()](./ResultMap.entries.md)

</td><td>



</td><td>

Returns an iterator over the map entries.

</td></tr>
<tr><td>

[forEach(cb, arg)](./ResultMap.forEach.md)

</td><td>



</td><td>

Calls a function for each entry in the map.

</td></tr>
<tr><td>

[get(key)](./ResultMap.get.md)

</td><td>



</td><td>

Gets a value from the map.

</td></tr>
<tr><td>

[getOrAdd(key, value)](./ResultMap.getOrAdd.md)

</td><td>



</td><td>

Gets a value from the map, or adds a supplied value it if it does not exist.

</td></tr>
<tr><td>

[has(key)](./ResultMap.has.md)

</td><td>



</td><td>

Returns `true` if the map contains a key.

</td></tr>
<tr><td>

[keys()](./ResultMap.keys.md)

</td><td>



</td><td>

Returns an iterator over the map keys.

</td></tr>
<tr><td>

[set(key, value)](./ResultMap.set.md)

</td><td>



</td><td>

Sets a key/value pair in the map.

</td></tr>
<tr><td>

[update(key, value)](./ResultMap.update.md)

</td><td>



</td><td>

Updates an existing key in the map - the map is not updated if the key does

</td></tr>
<tr><td>

[values()](./ResultMap.values.md)

</td><td>



</td><td>

Returns an iterator over the map values.

</td></tr>
<tr><td>

[_isResultMapValueFactory(value)](./ResultMap._isResultMapValueFactory.md)

</td><td>



</td><td>

Determines if a value is a Collections.ResultMapValueFactory | ResultMapValueFactory.

</td></tr>
<tr><td>

[[iterator]()](./ResultMap._iterator_.md)

</td><td>



</td><td>

Gets an iterator over the map entries.

</td></tr>
</tbody></table>
