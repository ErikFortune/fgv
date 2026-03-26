[Home](../README.md) > ConditionCollector

# Class: ConditionCollector

A `ValidatingCollector` for Conditions.Condition | Conditions,
which collects conditions supplied as either Conditions.Condition | Condition or
Conditions.IConditionDecl | IConditionDecl.

**Extends:** `ValidatingCollector<Condition>`

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

[qualifiers](./ConditionCollector.qualifiers.md)

</td><td>



</td><td>

[IReadOnlyQualifierCollector](../interfaces/IReadOnlyQualifierCollector.md)

</td><td>

The Qualifiers.IReadOnlyQualifierCollector | ReadOnlyQualifierCollector used to create conditions

</td></tr>
<tr><td>

[validating](./ConditionCollector.validating.md)

</td><td>

`readonly`

</td><td>

CollectorValidator&lt;[Condition](Condition.md)&gt;

</td><td>

A Collections.CollectorValidator | CollectorValidator which validates keys and values

</td></tr>
<tr><td>

[size](./ConditionCollector.size.md)

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

[create(params)](./ConditionCollector.create.md)

</td><td>

`static`

</td><td>

Creates a new Conditions.ConditionCollector | ConditionCollector object.

</td></tr>
<tr><td>

[createValidatingCollector(params)](./ConditionCollector.createValidatingCollector.md)

</td><td>

`static`

</td><td>

Creates a new Collections.ValidatingCollector | ValidatingCollector instance from

</td></tr>
<tr><td>

[createCollector(params)](./ConditionCollector.createCollector.md)

</td><td>

`static`

</td><td>

Creates a new Collections.Collector | Collector instance.

</td></tr>
<tr><td>

[toReadOnly()](./ConditionCollector.toReadOnly.md)

</td><td>



</td><td>

Gets a read-only version of this collector as a

</td></tr>
<tr><td>

[add(item)](./ConditionCollector.add.md)

</td><td>



</td><td>

Adds an item to the collection, failing if a different item with the same key already exists.

</td></tr>
<tr><td>

[entries()](./ConditionCollector.entries.md)

</td><td>



</td><td>

Collections.ResultMap.entries

</td></tr>
<tr><td>

[forEach(callback, arg)](./ConditionCollector.forEach.md)

</td><td>



</td><td>

Collections.ResultMap.forEach

</td></tr>
<tr><td>

[get(key)](./ConditionCollector.get.md)

</td><td>



</td><td>

Collections.ResultMap.get

</td></tr>
<tr><td>

[getAt(index)](./ConditionCollector.getAt.md)

</td><td>



</td><td>

Collections.IReadOnlyCollector.getAt

</td></tr>
<tr><td>

[getOrAdd(item)](./ConditionCollector.getOrAdd.md)

</td><td>



</td><td>

Gets an existing item with a key matching that of a supplied item, or adds the supplied

</td></tr>
<tr><td>

[has(key)](./ConditionCollector.has.md)

</td><td>



</td><td>

Collections.ResultMap.has

</td></tr>
<tr><td>

[keys()](./ConditionCollector.keys.md)

</td><td>



</td><td>

Collections.ResultMap.keys

</td></tr>
<tr><td>

[values()](./ConditionCollector.values.md)

</td><td>



</td><td>

Collections.ResultMap.values

</td></tr>
<tr><td>

[valuesByIndex()](./ConditionCollector.valuesByIndex.md)

</td><td>



</td><td>

Collections.IReadOnlyCollector.valuesByIndex

</td></tr>
<tr><td>

[[iterator]()](./ConditionCollector._iterator_.md)

</td><td>



</td><td>

Gets an iterator over the map entries.

</td></tr>
</tbody></table>
