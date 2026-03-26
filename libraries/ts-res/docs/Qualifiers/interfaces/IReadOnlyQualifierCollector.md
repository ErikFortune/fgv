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

Qualifiers.QualifierCollector.qualifierTypes

</td></tr>
<tr><td>

[validating](./IReadOnlyQualifierCollector.validating.md)

</td><td>

`readonly`

</td><td>

IReadOnlyCollectorValidator&lt;[Qualifier](../../classes/Qualifier.md)&gt;

</td><td>

Collections.ValidatingCollector.validating

</td></tr>
<tr><td>

[size](./IReadOnlyQualifierCollector.size.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Collections.ResultMap.size

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

Collections.IReadOnlyCollector.getAt

</td></tr>
<tr><td>

[valuesByIndex()](./IReadOnlyQualifierCollector.valuesByIndex.md)

</td><td>



</td><td>

Collections.IReadOnlyCollector.valuesByIndex

</td></tr>
<tr><td>

[entries()](./IReadOnlyQualifierCollector.entries.md)

</td><td>



</td><td>

Collections.ResultMap.entries

</td></tr>
<tr><td>

[forEach(cb, arg)](./IReadOnlyQualifierCollector.forEach.md)

</td><td>



</td><td>

Collections.ResultMap.forEach

</td></tr>
<tr><td>

[get(key)](./IReadOnlyQualifierCollector.get.md)

</td><td>



</td><td>

Collections.ResultMap.get

</td></tr>
<tr><td>

[has(key)](./IReadOnlyQualifierCollector.has.md)

</td><td>



</td><td>

Collections.ResultMap.has

</td></tr>
<tr><td>

[keys()](./IReadOnlyQualifierCollector.keys.md)

</td><td>



</td><td>

Collections.ResultMap.keys

</td></tr>
<tr><td>

[values()](./IReadOnlyQualifierCollector.values.md)

</td><td>



</td><td>

Collections.ResultMap.values

</td></tr>
<tr><td>

[[iterator]()](./IReadOnlyQualifierCollector._iterator_.md)

</td><td>



</td><td>

Gets an iterator over the map entries.

</td></tr>
</tbody></table>
