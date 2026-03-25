[Home](../../README.md) > [Resources](../README.md) > CandidateValueCollector

# Class: CandidateValueCollector

A `ValidatingCollector` for Resources.CandidateValue | CandidateValues,
which collects candidate values supplied as either Resources.CandidateValue | CandidateValue or
`JsonValue`.

**Extends:** `ValidatingCollector<CandidateValue>`

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

[normalizer](./CandidateValueCollector.normalizer.md)

</td><td>

`readonly`

</td><td>

HashingNormalizer

</td><td>



</td></tr>
<tr><td>

[validating](./CandidateValueCollector.validating.md)

</td><td>

`readonly`

</td><td>

CollectorValidator&lt;[CandidateValue](../../classes/CandidateValue.md)&gt;

</td><td>

A Collections.CollectorValidator | CollectorValidator which validates keys and values

</td></tr>
<tr><td>

[size](./CandidateValueCollector.size.md)

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

[create(params)](./CandidateValueCollector.create.md)

</td><td>

`static`

</td><td>

Creates a new Resources.CandidateValueCollector object.

</td></tr>
<tr><td>

[createValidatingCollector(params)](./CandidateValueCollector.createValidatingCollector.md)

</td><td>

`static`

</td><td>

Creates a new Collections.ValidatingCollector | ValidatingCollector instance from

</td></tr>
<tr><td>

[createCollector(params)](./CandidateValueCollector.createCollector.md)

</td><td>

`static`

</td><td>

Creates a new Collections.Collector | Collector instance.

</td></tr>
<tr><td>

[getValuesByIndex()](./CandidateValueCollector.getValuesByIndex.md)

</td><td>



</td><td>

Returns an array of JSON values ordered by their indices.

</td></tr>
<tr><td>

[toReadOnly()](./CandidateValueCollector.toReadOnly.md)

</td><td>



</td><td>

Gets a read-only version of this collector as a

</td></tr>
<tr><td>

[add(item)](./CandidateValueCollector.add.md)

</td><td>



</td><td>

Adds an item to the collection, failing if a different item with the same key already exists.

</td></tr>
<tr><td>

[entries()](./CandidateValueCollector.entries.md)

</td><td>



</td><td>

Collections.ResultMap.entries

</td></tr>
<tr><td>

[forEach(callback, arg)](./CandidateValueCollector.forEach.md)

</td><td>



</td><td>

Collections.ResultMap.forEach

</td></tr>
<tr><td>

[get(key)](./CandidateValueCollector.get.md)

</td><td>



</td><td>

Collections.ResultMap.get

</td></tr>
<tr><td>

[getAt(index)](./CandidateValueCollector.getAt.md)

</td><td>



</td><td>

Collections.IReadOnlyCollector.getAt

</td></tr>
<tr><td>

[getOrAdd(item)](./CandidateValueCollector.getOrAdd.md)

</td><td>



</td><td>

Gets an existing item with a key matching that of a supplied item, or adds the supplied

</td></tr>
<tr><td>

[has(key)](./CandidateValueCollector.has.md)

</td><td>



</td><td>

Collections.ResultMap.has

</td></tr>
<tr><td>

[keys()](./CandidateValueCollector.keys.md)

</td><td>



</td><td>

Collections.ResultMap.keys

</td></tr>
<tr><td>

[values()](./CandidateValueCollector.values.md)

</td><td>



</td><td>

Collections.ResultMap.values

</td></tr>
<tr><td>

[valuesByIndex()](./CandidateValueCollector.valuesByIndex.md)

</td><td>



</td><td>

Collections.IReadOnlyCollector.valuesByIndex

</td></tr>
<tr><td>

[[iterator]()](./CandidateValueCollector._iterator_.md)

</td><td>



</td><td>

Gets an iterator over the map entries.

</td></tr>
</tbody></table>
