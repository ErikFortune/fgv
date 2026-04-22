[Home](../../README.md) > [Qualifiers](../README.md) > IReadOnlyQualifierCollector

# Interface: IReadOnlyQualifierCollector

Readonly version of Qualifiers.QualifierCollector | QualifierCollector.

**Extends:** `IReadOnlyValidatingCollector<Qualifier>`

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

[qualifierTypes](./IReadOnlyQualifierCollector.qualifierTypes.md)

</td><td>

`readonly`

</td><td>

[ReadOnlyQualifierTypeCollector](../../type-aliases/ReadOnlyQualifierTypeCollector.md)

</td><td>

The QualifierTypes.QualifierTypeCollector | qualifier types that this collector uses.

</td></tr>
<tr><td>

[validating](./IReadOnlyQualifierCollector.validating.md)

</td><td>

`readonly`

</td><td>

IReadOnlyCollectorValidator&lt;[Qualifier](../../classes/Qualifier.md)&gt;

</td><td>

A Collections.CollectorValidator | CollectorValidator which validates keys and values

</td></tr>
<tr><td>

[size](./IReadOnlyQualifierCollector.size.md)

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

[getByNameOrToken(nameOrToken)](./IReadOnlyQualifierCollector.getByNameOrToken.md)

</td><td>



</td><td>

Gets a Qualifiers.Qualifier | qualifier by name or token.

</td></tr>
<tr><td>

[hasNameOrToken(nameOrToken)](./IReadOnlyQualifierCollector.hasNameOrToken.md)

</td><td>



</td><td>

Checks if a qualifier with a given name or token is in the collection.

</td></tr>
<tr><td>

[getAt(index)](./IReadOnlyQualifierCollector.getAt.md)

</td><td>



</td><td>

Gets the item at a specified index.

</td></tr>
<tr><td>

[valuesByIndex()](./IReadOnlyQualifierCollector.valuesByIndex.md)

</td><td>



</td><td>

Gets all items in the collection, ordered by index.

</td></tr>
<tr><td>

[entries()](./IReadOnlyQualifierCollector.entries.md)

</td><td>



</td><td>

Returns an iterator over the map entries.

</td></tr>
<tr><td>

[forEach(cb, arg)](./IReadOnlyQualifierCollector.forEach.md)

</td><td>



</td><td>

Calls a function for each entry in the map.

</td></tr>
<tr><td>

[get(key)](./IReadOnlyQualifierCollector.get.md)

</td><td>



</td><td>

Gets a value from the map.

</td></tr>
<tr><td>

[has(key)](./IReadOnlyQualifierCollector.has.md)

</td><td>



</td><td>

Returns `true` if the map contains a key.

</td></tr>
<tr><td>

[keys()](./IReadOnlyQualifierCollector.keys.md)

</td><td>



</td><td>

Returns an iterator over the map keys.

</td></tr>
<tr><td>

[values()](./IReadOnlyQualifierCollector.values.md)

</td><td>



</td><td>

Returns an iterator over the map values.

</td></tr>
<tr><td>

[[iterator]()](./IReadOnlyQualifierCollector._iterator_.md)

</td><td>



</td><td>

Gets an iterator over the map entries.

</td></tr>
</tbody></table>
