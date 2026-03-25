[Home](../../README.md) > [Decisions](../README.md) > AbstractDecisionCollector

# Class: AbstractDecisionCollector

A `ValidatingCollector` for Decisions.AbstractDecision | AbstractDecisions.

**Extends:** `ValidatingCollector<AbstractDecision>`

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

[EmptyDecisionIndex](./AbstractDecisionCollector.EmptyDecisionIndex.md)

</td><td>

`readonly` `static`

</td><td>

[DecisionIndex](../../type-aliases/DecisionIndex.md)

</td><td>

The index for the empty decision.

</td></tr>
<tr><td>

[DefaultOnlyDecisionIndex](./AbstractDecisionCollector.DefaultOnlyDecisionIndex.md)

</td><td>

`readonly` `static`

</td><td>

[DecisionIndex](../../type-aliases/DecisionIndex.md)

</td><td>

The index for the default-only decision.

</td></tr>
<tr><td>

[conditionSets](./AbstractDecisionCollector.conditionSets.md)

</td><td>

`readonly`

</td><td>

[ReadOnlyConditionSetCollector](../../type-aliases/ReadOnlyConditionSetCollector.md)

</td><td>

The Conditions.ReadOnlyConditionSetCollector | ConditionSetCollector used to create conditions

</td></tr>
<tr><td>

[validating](./AbstractDecisionCollector.validating.md)

</td><td>

`readonly`

</td><td>

CollectorValidator&lt;[AbstractDecision](../../classes/AbstractDecision.md)&gt;

</td><td>

A Collections.CollectorValidator | CollectorValidator which validates keys and values

</td></tr>
<tr><td>

[emptyDecision](./AbstractDecisionCollector.emptyDecision.md)

</td><td>

`readonly`

</td><td>

[AbstractDecision](../../classes/AbstractDecision.md)

</td><td>

The empty decision (no condition sets) for this collector.

</td></tr>
<tr><td>

[defaultOnlyDecision](./AbstractDecisionCollector.defaultOnlyDecision.md)

</td><td>

`readonly`

</td><td>

[AbstractDecision](../../classes/AbstractDecision.md)

</td><td>

The default-only decision (one condition set with no conditions) for this collector.

</td></tr>
<tr><td>

[size](./AbstractDecisionCollector.size.md)

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

[create(params)](./AbstractDecisionCollector.create.md)

</td><td>

`static`

</td><td>

Creates a new instance of Decisions.AbstractDecisionCollector | AbstractDecisionCollector.

</td></tr>
<tr><td>

[createValidatingCollector(params)](./AbstractDecisionCollector.createValidatingCollector.md)

</td><td>

`static`

</td><td>

Creates a new Collections.ValidatingCollector | ValidatingCollector instance from

</td></tr>
<tr><td>

[createCollector(params)](./AbstractDecisionCollector.createCollector.md)

</td><td>

`static`

</td><td>

Creates a new Collections.Collector | Collector instance.

</td></tr>
<tr><td>

[toReadOnly()](./AbstractDecisionCollector.toReadOnly.md)

</td><td>



</td><td>

Gets a read-only version of this collector as a

</td></tr>
<tr><td>

[add(item)](./AbstractDecisionCollector.add.md)

</td><td>



</td><td>

Adds an item to the collection, failing if a different item with the same key already exists.

</td></tr>
<tr><td>

[entries()](./AbstractDecisionCollector.entries.md)

</td><td>



</td><td>

Collections.ResultMap.entries

</td></tr>
<tr><td>

[forEach(callback, arg)](./AbstractDecisionCollector.forEach.md)

</td><td>



</td><td>

Collections.ResultMap.forEach

</td></tr>
<tr><td>

[get(key)](./AbstractDecisionCollector.get.md)

</td><td>



</td><td>

Collections.ResultMap.get

</td></tr>
<tr><td>

[getAt(index)](./AbstractDecisionCollector.getAt.md)

</td><td>



</td><td>

Collections.IReadOnlyCollector.getAt

</td></tr>
<tr><td>

[getOrAdd(item)](./AbstractDecisionCollector.getOrAdd.md)

</td><td>



</td><td>

Gets an existing item with a key matching that of a supplied item, or adds the supplied

</td></tr>
<tr><td>

[has(key)](./AbstractDecisionCollector.has.md)

</td><td>



</td><td>

Collections.ResultMap.has

</td></tr>
<tr><td>

[keys()](./AbstractDecisionCollector.keys.md)

</td><td>



</td><td>

Collections.ResultMap.keys

</td></tr>
<tr><td>

[values()](./AbstractDecisionCollector.values.md)

</td><td>



</td><td>

Collections.ResultMap.values

</td></tr>
<tr><td>

[valuesByIndex()](./AbstractDecisionCollector.valuesByIndex.md)

</td><td>



</td><td>

Collections.IReadOnlyCollector.valuesByIndex

</td></tr>
<tr><td>

[[iterator]()](./AbstractDecisionCollector._iterator_.md)

</td><td>



</td><td>

Gets an iterator over the map entries.

</td></tr>
</tbody></table>
