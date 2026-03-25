[Home](../README.md) > QualifierCollector

# Class: QualifierCollector

Collects Qualifiers.Qualifier | Qualifiers from Qualifiers.IQualifierDecl | declarations,
with strongly-typed (QualifierName | QualifierName and QualifierIndex | QualifierIndex) key
and index.

**Extends:** `ValidatingConvertingCollector<Qualifier, IQualifierDecl>`

**Implements:** [`IReadOnlyQualifierCollector`](../interfaces/IReadOnlyQualifierCollector.md)

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

[qualifierTypes](./QualifierCollector.qualifierTypes.md)

</td><td>



</td><td>

[ReadOnlyQualifierTypeCollector](../type-aliases/ReadOnlyQualifierTypeCollector.md)

</td><td>

The QualifierTypes.QualifierTypeCollector | qualifier types that this collector uses.

</td></tr>
<tr><td>

[validating](./QualifierCollector.validating.md)

</td><td>

`readonly`

</td><td>

ConvertingCollectorValidator&lt;[Qualifier](Qualifier.md), [IQualifierDecl](../interfaces/IQualifierDecl.md)&gt;

</td><td>

A Collections.ConvertingCollectorValidator | ConvertingCollectorValidator which validates keys and values

</td></tr>
<tr><td>

[size](./QualifierCollector.size.md)

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

[create(params)](./QualifierCollector.create.md)

</td><td>

`static`

</td><td>

Creates a new Qualifiers.QualifierCollector | QualifierCollector object.

</td></tr>
<tr><td>

[createValidatingCollector(params)](./QualifierCollector.createValidatingCollector.md)

</td><td>

`static`

</td><td>

Creates a new Collections.ValidatingConvertingCollector | ValidatingConvertingCollector instance from

</td></tr>
<tr><td>

[createConvertingCollector(params)](./QualifierCollector.createConvertingCollector.md)

</td><td>

`static`

</td><td>

Creates a new Collections.ConvertingCollector | ConvertingCollector.

</td></tr>
<tr><td>

[createCollector(params)](./QualifierCollector.createCollector.md)

</td><td>

`static`

</td><td>

Creates a new Collections.Collector | Collector instance.

</td></tr>
<tr><td>

[getByNameOrToken(nameOrToken)](./QualifierCollector.getByNameOrToken.md)

</td><td>



</td><td>

Qualifiers.IReadOnlyQualifierCollector.getByNameOrToken

</td></tr>
<tr><td>

[hasNameOrToken(nameOrToken)](./QualifierCollector.hasNameOrToken.md)

</td><td>



</td><td>

Qualifiers.IReadOnlyQualifierCollector.hasNameOrToken

</td></tr>
<tr><td>

[toReadOnly()](./QualifierCollector.toReadOnly.md)

</td><td>



</td><td>

Gets a read-only view of this collector.

</td></tr>
<tr><td>

[_qualifierFactory(__key, index, decl)](./QualifierCollector._qualifierFactory.md)

</td><td>



</td><td>

Factory method for creating a Qualifiers.Qualifier | Qualifier from a Qualifiers.IQualifierDecl | declaration.

</td></tr>
<tr><td>

[add(item)](./QualifierCollector.add.md)

</td><td>



</td><td>

Collections.Collector.add

</td></tr>
<tr><td>

[getOrAdd(item)](./QualifierCollector.getOrAdd.md)

</td><td>



</td><td>

Collections.Collector.getOrAdd

</td></tr>
<tr><td>

[_isFactoryCB(itemOrCb)](./QualifierCollector._isFactoryCB.md)

</td><td>



</td><td>

Helper method for derived classes to determine if a supplied

</td></tr>
<tr><td>

[_overloadIsItem(keyOrItem, itemOrCb)](./QualifierCollector._overloadIsItem.md)

</td><td>



</td><td>

Helper method for derived classes to determine if a supplied

</td></tr>
<tr><td>

[_buildItem(key, itemOrCb)](./QualifierCollector._buildItem.md)

</td><td>



</td><td>

Helper method for derived classes to build an item from a key and a source representation using

</td></tr>
<tr><td>

[entries()](./QualifierCollector.entries.md)

</td><td>



</td><td>

Collections.ResultMap.entries

</td></tr>
<tr><td>

[forEach(callback, arg)](./QualifierCollector.forEach.md)

</td><td>



</td><td>

Collections.ResultMap.forEach

</td></tr>
<tr><td>

[get(key)](./QualifierCollector.get.md)

</td><td>



</td><td>

Collections.ResultMap.get

</td></tr>
<tr><td>

[getAt(index)](./QualifierCollector.getAt.md)

</td><td>



</td><td>

Collections.IReadOnlyCollector.getAt

</td></tr>
<tr><td>

[has(key)](./QualifierCollector.has.md)

</td><td>



</td><td>

Collections.ResultMap.has

</td></tr>
<tr><td>

[keys()](./QualifierCollector.keys.md)

</td><td>



</td><td>

Collections.ResultMap.keys

</td></tr>
<tr><td>

[values()](./QualifierCollector.values.md)

</td><td>



</td><td>

Collections.ResultMap.values

</td></tr>
<tr><td>

[valuesByIndex()](./QualifierCollector.valuesByIndex.md)

</td><td>



</td><td>

Collections.IReadOnlyCollector.valuesByIndex

</td></tr>
<tr><td>

[[iterator]()](./QualifierCollector._iterator_.md)

</td><td>



</td><td>

Gets an iterator over the map entries.

</td></tr>
</tbody></table>
