[Home](../../README.md) > [Conditions](../README.md) > ConditionSetCollector

# Class: ConditionSetCollector

A `ValidatingCollector` for Conditions.ConditionSet | ConditionSets,
which collects condition sets supplied as Conditions.ConditionSet | ConditionSet or
as Conditions.IConditionSetDecl | IConditionSetDecl via the methods on the
`validating` property.

**Extends:** `ValidatingCollector<ConditionSet>`

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

[UnconditionalIndex](./ConditionSetCollector.UnconditionalIndex.md)

</td><td>

`static`

</td><td>

[ConditionSetIndex](../../type-aliases/ConditionSetIndex.md)

</td><td>

The index of the unconditional condition set.

</td></tr>
<tr><td>

[conditions](./ConditionSetCollector.conditions.md)

</td><td>



</td><td>

[ConditionCollector](../../classes/ConditionCollector.md)

</td><td>

Gets the Conditions.ConditionCollector | ConditionCollector used to create conditions

</td></tr>
<tr><td>

[validating](./ConditionSetCollector.validating.md)

</td><td>

`readonly`

</td><td>

CollectorValidator&lt;[ConditionSet](../../classes/ConditionSet.md)&gt;

</td><td>

A Collections.CollectorValidator | CollectorValidator which validates keys and values

</td></tr>
<tr><td>

[unconditionalConditionSet](./ConditionSetCollector.unconditionalConditionSet.md)

</td><td>

`readonly`

</td><td>

[ConditionSet](../../classes/ConditionSet.md)

</td><td>

Gets the Conditions.ConditionSet | ConditionSet at the unconditional

</td></tr>
<tr><td>

[size](./ConditionSetCollector.size.md)

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

[create(params)](./ConditionSetCollector.create.md)

</td><td>

`static`

</td><td>

Creates a new Conditions.ConditionSetCollector | ConditionSetCollector.

</td></tr>
<tr><td>

[createValidatingCollector(params)](./ConditionSetCollector.createValidatingCollector.md)

</td><td>

`static`

</td><td>

Creates a new Collections.ValidatingCollector | ValidatingCollector instance from

</td></tr>
<tr><td>

[createCollector(params)](./ConditionSetCollector.createCollector.md)

</td><td>

`static`

</td><td>

Creates a new Collections.Collector | Collector instance.

</td></tr>
<tr><td>

[toReadOnly()](./ConditionSetCollector.toReadOnly.md)

</td><td>



</td><td>

Gets a read-only version of this collector as a

</td></tr>
<tr><td>

[add(item)](./ConditionSetCollector.add.md)

</td><td>



</td><td>

Adds an item to the collection, failing if a different item with the same key already exists.

</td></tr>
<tr><td>

[entries()](./ConditionSetCollector.entries.md)

</td><td>



</td><td>

Collections.ResultMap.entries

</td></tr>
<tr><td>

[forEach(callback, arg)](./ConditionSetCollector.forEach.md)

</td><td>



</td><td>

Collections.ResultMap.forEach

</td></tr>
<tr><td>

[get(key)](./ConditionSetCollector.get.md)

</td><td>



</td><td>

Collections.ResultMap.get

</td></tr>
<tr><td>

[getAt(index)](./ConditionSetCollector.getAt.md)

</td><td>



</td><td>

Collections.IReadOnlyCollector.getAt

</td></tr>
<tr><td>

[getOrAdd(item)](./ConditionSetCollector.getOrAdd.md)

</td><td>



</td><td>

Gets an existing item with a key matching that of a supplied item, or adds the supplied

</td></tr>
<tr><td>

[has(key)](./ConditionSetCollector.has.md)

</td><td>



</td><td>

Collections.ResultMap.has

</td></tr>
<tr><td>

[keys()](./ConditionSetCollector.keys.md)

</td><td>



</td><td>

Collections.ResultMap.keys

</td></tr>
<tr><td>

[values()](./ConditionSetCollector.values.md)

</td><td>



</td><td>

Collections.ResultMap.values

</td></tr>
<tr><td>

[valuesByIndex()](./ConditionSetCollector.valuesByIndex.md)

</td><td>



</td><td>

Collections.IReadOnlyCollector.valuesByIndex

</td></tr>
<tr><td>

[[iterator]()](./ConditionSetCollector._iterator_.md)

</td><td>



</td><td>

Gets an iterator over the map entries.

</td></tr>
</tbody></table>
