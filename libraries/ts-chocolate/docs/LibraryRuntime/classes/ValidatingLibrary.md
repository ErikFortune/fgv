[Home](../../README.md) > [LibraryRuntime](../README.md) > ValidatingLibrary

# Class: ValidatingLibrary

A ValidatingResultMap with integrated find functionality.
Combines map-based access (get, has, values) with query-based search (find).

This provides a symmetric API where both `library.get(id)` and
`library.find({ byTag: {...} })` work together naturally.

**Extends:** `ValidatingResultMap<TK, TV>`

**Implements:** [`IReadOnlyValidatingLibrary<TK, TV, TSpec>`](../../interfaces/IReadOnlyValidatingLibrary.md)

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

Creates a new ValidatingLibrary.

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

[validating](./ValidatingLibrary.validating.md)

</td><td>

`readonly`

</td><td>

ResultMapValidator&lt;TK, TV&gt;

</td><td>

A Collections.ResultMapValidator | ResultMapValidator which validates keys and values

</td></tr>
<tr><td>

[_inner](./ValidatingLibrary._inner.md)

</td><td>

`readonly`

</td><td>

Map&lt;TK, TV&gt;

</td><td>

Protected raw access to the inner `Map<TK, TV>` object.

</td></tr>
<tr><td>

[size](./ValidatingLibrary.size.md)

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

[createValidatingResultMap(params)](./ValidatingLibrary.createValidatingResultMap.md)

</td><td>

`static`

</td><td>

Creates a new Collections.ValidatingResultMap | ValidatingResultMap instance.

</td></tr>
<tr><td>

[create(elements)](./ValidatingLibrary.create.md)

</td><td>

`static`

</td><td>

Creates a new Collections.ResultMap | ResultMap.

</td></tr>
<tr><td>

[find(spec, options)](./ValidatingLibrary.find.md)

</td><td>



</td><td>

Finds entities matching a query specification.

</td></tr>
<tr><td>

[toReadOnly()](./ValidatingLibrary.toReadOnly.md)

</td><td>



</td><td>

Gets a read-only view of this library.

</td></tr>
<tr><td>

[add(key, value)](./ValidatingLibrary.add.md)

</td><td>



</td><td>

Sets a key/value pair in the map if the key does not already exist.

</td></tr>
<tr><td>

[clear()](./ValidatingLibrary.clear.md)

</td><td>



</td><td>

Clears the map.

</td></tr>
<tr><td>

[delete(key)](./ValidatingLibrary.delete.md)

</td><td>



</td><td>

Deletes a key from the map.

</td></tr>
<tr><td>

[entries()](./ValidatingLibrary.entries.md)

</td><td>



</td><td>

Returns an iterator over the map entries.

</td></tr>
<tr><td>

[forEach(cb, arg)](./ValidatingLibrary.forEach.md)

</td><td>



</td><td>

Calls a function for each entry in the map.

</td></tr>
<tr><td>

[get(key)](./ValidatingLibrary.get.md)

</td><td>



</td><td>

Gets a value from the map.

</td></tr>
<tr><td>

[getOrAdd(key, value)](./ValidatingLibrary.getOrAdd.md)

</td><td>



</td><td>

Gets a value from the map, or adds a supplied value it if it does not exist.

</td></tr>
<tr><td>

[has(key)](./ValidatingLibrary.has.md)

</td><td>



</td><td>

Returns `true` if the map contains a key.

</td></tr>
<tr><td>

[keys()](./ValidatingLibrary.keys.md)

</td><td>



</td><td>

Returns an iterator over the map keys.

</td></tr>
<tr><td>

[set(key, value)](./ValidatingLibrary.set.md)

</td><td>



</td><td>

Sets a key/value pair in the map.

</td></tr>
<tr><td>

[update(key, value)](./ValidatingLibrary.update.md)

</td><td>



</td><td>

Updates an existing key in the map - the map is not updated if the key does

</td></tr>
<tr><td>

[values()](./ValidatingLibrary.values.md)

</td><td>



</td><td>

Returns an iterator over the map values.

</td></tr>
<tr><td>

[_isResultMapValueFactory(value)](./ValidatingLibrary._isResultMapValueFactory.md)

</td><td>



</td><td>

Determines if a value is a Collections.ResultMapValueFactory | ResultMapValueFactory.

</td></tr>
<tr><td>

[[iterator]()](./ValidatingLibrary._iterator_.md)

</td><td>



</td><td>

Gets an iterator over the map entries.

</td></tr>
</tbody></table>
