[Home](../README.md) > ResourceTypeCollector

# Class: ResourceTypeCollector

Map ResourceTypeName | resource type names to ResourceTypes.ResourceType | resource types.

**Extends:** `ValidatingCollector<ResourceType>`

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

[validating](./ResourceTypeCollector.validating.md)

</td><td>

`readonly`

</td><td>

CollectorValidator&lt;[ResourceType](ResourceType.md)&lt;unknown&gt;&gt;

</td><td>

A Collections.CollectorValidator | CollectorValidator which validates keys and values

</td></tr>
<tr><td>

[size](./ResourceTypeCollector.size.md)

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

[create(params)](./ResourceTypeCollector.create.md)

</td><td>

`static`

</td><td>

Creates a new ResourceTypes.ResourceTypeCollector | ResourceTypeCollector.

</td></tr>
<tr><td>

[createValidatingCollector(params)](./ResourceTypeCollector.createValidatingCollector.md)

</td><td>

`static`

</td><td>

Creates a new Collections.ValidatingCollector | ValidatingCollector instance from

</td></tr>
<tr><td>

[createCollector(params)](./ResourceTypeCollector.createCollector.md)

</td><td>

`static`

</td><td>

Creates a new Collections.Collector | Collector instance.

</td></tr>
<tr><td>

[toReadOnly()](./ResourceTypeCollector.toReadOnly.md)

</td><td>



</td><td>

Gets a read-only version of this collector as a

</td></tr>
<tr><td>

[add(item)](./ResourceTypeCollector.add.md)

</td><td>



</td><td>

Adds an item to the collection, failing if a different item with the same key already exists.

</td></tr>
<tr><td>

[entries()](./ResourceTypeCollector.entries.md)

</td><td>



</td><td>

Collections.ResultMap.entries

</td></tr>
<tr><td>

[forEach(callback, arg)](./ResourceTypeCollector.forEach.md)

</td><td>



</td><td>

Collections.ResultMap.forEach

</td></tr>
<tr><td>

[get(key)](./ResourceTypeCollector.get.md)

</td><td>



</td><td>

Collections.ResultMap.get

</td></tr>
<tr><td>

[getAt(index)](./ResourceTypeCollector.getAt.md)

</td><td>



</td><td>

Collections.IReadOnlyCollector.getAt

</td></tr>
<tr><td>

[getOrAdd(item)](./ResourceTypeCollector.getOrAdd.md)

</td><td>



</td><td>

Gets an existing item with a key matching that of a supplied item, or adds the supplied

</td></tr>
<tr><td>

[has(key)](./ResourceTypeCollector.has.md)

</td><td>



</td><td>

Collections.ResultMap.has

</td></tr>
<tr><td>

[keys()](./ResourceTypeCollector.keys.md)

</td><td>



</td><td>

Collections.ResultMap.keys

</td></tr>
<tr><td>

[values()](./ResourceTypeCollector.values.md)

</td><td>



</td><td>

Collections.ResultMap.values

</td></tr>
<tr><td>

[valuesByIndex()](./ResourceTypeCollector.valuesByIndex.md)

</td><td>



</td><td>

Collections.IReadOnlyCollector.valuesByIndex

</td></tr>
<tr><td>

[[iterator]()](./ResourceTypeCollector._iterator_.md)

</td><td>



</td><td>

Gets an iterator over the map entries.

</td></tr>
</tbody></table>
