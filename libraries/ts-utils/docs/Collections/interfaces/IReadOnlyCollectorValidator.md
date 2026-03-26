[Home](../../README.md) > [Collections](../README.md) > IReadOnlyCollectorValidator

# Interface: IReadOnlyCollectorValidator

A read-only interface exposing non-mutating methods of a
Collections.CollectorValidator | CollectorValidator.

**Extends:** [`IReadOnlyResultMapValidator<CollectibleKey<TITEM>, TITEM>`](../../interfaces/IReadOnlyResultMapValidator.md)

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

[map](./IReadOnlyCollectorValidator.map.md)

</td><td>

`readonly`

</td><td>

[IReadOnlyResultMap](../../interfaces/IReadOnlyResultMap.md)&lt;[CollectibleKey](../../type-aliases/CollectibleKey.md)&lt;TITEM&gt;, TITEM&gt;

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

[get(key)](./IReadOnlyCollectorValidator.get.md)

</td><td>



</td><td>

Gets a value from the map.

</td></tr>
<tr><td>

[has(key)](./IReadOnlyCollectorValidator.has.md)

</td><td>



</td><td>

Returns `true` if the map contains a key.

</td></tr>
<tr><td>

[getOrAdd(key, factory)](./IReadOnlyCollectorValidator.getOrAdd.md)

</td><td>



</td><td>

Gets an existing item with a key matching that of a supplied item, or adds the supplied

</td></tr>
</tbody></table>
