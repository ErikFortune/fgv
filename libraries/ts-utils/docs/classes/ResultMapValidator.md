[Home](../README.md) > ResultMapValidator

# Class: ResultMapValidator

A Collections.ResultMap | ResultMap wrapper which validates weakly-typed keys
before calling the wrapped result map.

**Implements:** [`IReadOnlyResultMapValidator<TK, TV>`](../interfaces/IReadOnlyResultMapValidator.md)

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

Constructs a new Collections.ResultMapValidator | ResultMapValidator.

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

[converters](./ResultMapValidator.converters.md)

</td><td>

`readonly`

</td><td>

[KeyValueConverters](KeyValueConverters.md)&lt;TK, TV&gt;

</td><td>



</td></tr>
<tr><td>

[map](./ResultMapValidator.map.md)

</td><td>

`readonly`

</td><td>

[IReadOnlyResultMap](../interfaces/IReadOnlyResultMap.md)&lt;TK, TV&gt;

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

[add(key, value)](./ResultMapValidator.add.md)

</td><td>



</td><td>

Sets a key/value pair in the map if the key does not already exist.

</td></tr>
<tr><td>

[delete(key)](./ResultMapValidator.delete.md)

</td><td>



</td><td>

Deletes a key from the map.

</td></tr>
<tr><td>

[get(key)](./ResultMapValidator.get.md)

</td><td>



</td><td>

Gets a value from the map.

</td></tr>
<tr><td>

[getOrAdd(key, value)](./ResultMapValidator.getOrAdd.md)

</td><td>



</td><td>

Gets a value from the map, or adds a supplied value it if it does not exist.

</td></tr>
<tr><td>

[has(key)](./ResultMapValidator.has.md)

</td><td>



</td><td>

Returns `true` if the map contains a key.

</td></tr>
<tr><td>

[set(key, value)](./ResultMapValidator.set.md)

</td><td>



</td><td>

Sets a key/value pair in the map.

</td></tr>
<tr><td>

[update(key, value)](./ResultMapValidator.update.md)

</td><td>



</td><td>

Updates an existing key in the map - the map is not updated if the key does

</td></tr>
<tr><td>

[toReadOnly()](./ResultMapValidator.toReadOnly.md)

</td><td>



</td><td>

Gets a read-only version of this validator.

</td></tr>
<tr><td>

[_isResultMapValueFactory(value)](./ResultMapValidator._isResultMapValueFactory.md)

</td><td>



</td><td>

Determines if a value is a Collections.ResultMapValueFactory | ResultMapValueFactory.

</td></tr>
</tbody></table>
