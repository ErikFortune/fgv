[Home](../../README.md) > [Collections](../README.md) > AggregatedResultMapValidator

# Class: AggregatedResultMapValidator

A validator for weakly-typed access to an AggregatedResultMap | aggregated result map.

**Implements:** [`IReadOnlyResultMapValidator<TCOMPOSITEID, TITEM>`](../../interfaces/IReadOnlyResultMapValidator.md)

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

`constructor(map, converters)`

</td><td>



</td><td>

Constructs a new AggregatedResultMapValidator | aggregated result map validator.

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

[converters](./AggregatedResultMapValidator.converters.md)

</td><td>

`readonly`

</td><td>

[KeyValueConverters](../../classes/KeyValueConverters.md)&lt;TCOMPOSITEID, TITEM&gt;

</td><td>

The key-value converters used for validating weakly-typed access.

</td></tr>
<tr><td>

[map](./AggregatedResultMapValidator.map.md)

</td><td>

`readonly`

</td><td>

[IReadOnlyValidatingResultMap](../../interfaces/IReadOnlyValidatingResultMap.md)&lt;TCOMPOSITEID, TITEM&gt;

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

[get(key)](./AggregatedResultMapValidator.get.md)

</td><td>



</td><td>

Gets a value from the map.

</td></tr>
<tr><td>

[has(key)](./AggregatedResultMapValidator.has.md)

</td><td>



</td><td>

Returns `true` if the map contains a key.

</td></tr>
<tr><td>

[add(key, value)](./AggregatedResultMapValidator.add.md)

</td><td>



</td><td>

Sets a key/value pair in the map if the key does not already exist.

</td></tr>
<tr><td>

[set(key, value)](./AggregatedResultMapValidator.set.md)

</td><td>



</td><td>

Sets a key/value pair in the map.

</td></tr>
<tr><td>

[update(key, value)](./AggregatedResultMapValidator.update.md)

</td><td>



</td><td>

Updates an existing key in the map - the map is not updated if the key does

</td></tr>
<tr><td>

[delete(key)](./AggregatedResultMapValidator.delete.md)

</td><td>



</td><td>

Deletes a key from the map.

</td></tr>
</tbody></table>
