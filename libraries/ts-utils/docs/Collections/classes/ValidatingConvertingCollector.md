[Home](../../README.md) > [Collections](../README.md) > ValidatingConvertingCollector

# Class: ValidatingConvertingCollector

A Collections.ConvertingCollector | ConvertingCollector with a
Collections.ConvertingCollectorValidator | ConvertingCollectorValidator
property that enables validated use of the underlying map with weakly-typed keys and values.

**Extends:** [`ConvertingCollector<TITEM, TSRC>`](../../classes/ConvertingCollector.md)

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

Constructs a new Collections.ValidatingConvertingCollector | ValidatingConvertingCollector
from the supplied Collections.IValidatingConvertingCollectorConstructorParams | parameters.

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

[validating](./ValidatingConvertingCollector.validating.md)

</td><td>

`readonly`

</td><td>

[ConvertingCollectorValidator](../../classes/ConvertingCollectorValidator.md)&lt;TITEM, TSRC&gt;

</td><td>

A Collections.ConvertingCollectorValidator | ConvertingCollectorValidator which validates keys and values

</td></tr>
<tr><td>

[size](./ConvertingCollector.size.md)

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

[createValidatingCollector(params)](./ValidatingConvertingCollector.createValidatingCollector.md)

</td><td>

`static`

</td><td>

Creates a new Collections.ValidatingConvertingCollector | ValidatingConvertingCollector instance from

</td></tr>
<tr><td>

[createConvertingCollector(params)](./ConvertingCollector.createConvertingCollector.md)

</td><td>

`static`

</td><td>

Creates a new Collections.ConvertingCollector | ConvertingCollector.

</td></tr>
<tr><td>

[createCollector(params)](./ConvertingCollector.createCollector.md)

</td><td>

`static`

</td><td>

Creates a new Collections.Collector | Collector instance.

</td></tr>
<tr><td>

[toReadOnly()](./ValidatingConvertingCollector.toReadOnly.md)

</td><td>



</td><td>

Gets a read-only version of this collector as a

</td></tr>
<tr><td>

[add(item)](./ConvertingCollector.add.md)

</td><td>



</td><td>

Adds an item to the collection, failing if a different item with the same key already exists.

</td></tr>
<tr><td>

[getOrAdd(item)](./ConvertingCollector.getOrAdd.md)

</td><td>



</td><td>

Gets an existing item with a key matching that of a supplied item, or adds the supplied

</td></tr>
<tr><td>

[_isFactoryCB(itemOrCb)](./ConvertingCollector._isFactoryCB.md)

</td><td>



</td><td>

Helper method for derived classes to determine if a supplied

</td></tr>
<tr><td>

[_overloadIsItem(keyOrItem, itemOrCb)](./ConvertingCollector._overloadIsItem.md)

</td><td>



</td><td>

Helper method for derived classes to determine if a supplied

</td></tr>
<tr><td>

[_buildItem(key, itemOrCb)](./ConvertingCollector._buildItem.md)

</td><td>



</td><td>

Helper method for derived classes to build an item from a key and a source representation using

</td></tr>
<tr><td>

[entries()](./ConvertingCollector.entries.md)

</td><td>



</td><td>

Returns an iterator over the map entries.

</td></tr>
<tr><td>

[forEach(callback, arg)](./ConvertingCollector.forEach.md)

</td><td>



</td><td>

Calls a function for each entry in the map.

</td></tr>
<tr><td>

[get(key)](./ConvertingCollector.get.md)

</td><td>



</td><td>

Gets a value from the map.

</td></tr>
<tr><td>

[getAt(index)](./ConvertingCollector.getAt.md)

</td><td>



</td><td>

Gets the item at a specified index.

</td></tr>
<tr><td>

[has(key)](./ConvertingCollector.has.md)

</td><td>



</td><td>

Returns `true` if the map contains a key.

</td></tr>
<tr><td>

[keys()](./ConvertingCollector.keys.md)

</td><td>



</td><td>

Returns an iterator over the map keys.

</td></tr>
<tr><td>

[values()](./ConvertingCollector.values.md)

</td><td>



</td><td>

Returns an iterator over the map values.

</td></tr>
<tr><td>

[valuesByIndex()](./ConvertingCollector.valuesByIndex.md)

</td><td>



</td><td>

Gets all items in the collection, ordered by index.

</td></tr>
<tr><td>

[[iterator]()](./ConvertingCollector._iterator_.md)

</td><td>



</td><td>

Gets an iterator over the map entries.

</td></tr>
</tbody></table>
