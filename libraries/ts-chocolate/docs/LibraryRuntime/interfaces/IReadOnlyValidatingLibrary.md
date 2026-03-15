[Home](../../README.md) > [LibraryRuntime](../README.md) > IReadOnlyValidatingLibrary

# Interface: IReadOnlyValidatingLibrary

Read-only interface for ValidatingLibrary.
Extends IReadOnlyValidatingResultMap with a find method for query-based search.

**Extends:** `IReadOnlyValidatingResultMap<TK, TV>`

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

[validating](./IReadOnlyValidatingLibrary.validating.md)

</td><td>

`readonly`

</td><td>

IReadOnlyResultMapValidator&lt;TK, TV&gt;

</td><td>

Collections.ValidatingResultMap.validating

</td></tr>
<tr><td>

[size](./IReadOnlyValidatingLibrary.size.md)

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

[find(spec, options)](./IReadOnlyValidatingLibrary.find.md)

</td><td>



</td><td>

Finds entities matching a query specification.

</td></tr>
<tr><td>

[entries()](./IReadOnlyValidatingLibrary.entries.md)

</td><td>



</td><td>

Collections.ResultMap.entries

</td></tr>
<tr><td>

[forEach(cb, arg)](./IReadOnlyValidatingLibrary.forEach.md)

</td><td>



</td><td>

Collections.ResultMap.forEach

</td></tr>
<tr><td>

[get(key)](./IReadOnlyValidatingLibrary.get.md)

</td><td>



</td><td>

Collections.ResultMap.get

</td></tr>
<tr><td>

[has(key)](./IReadOnlyValidatingLibrary.has.md)

</td><td>



</td><td>

Collections.ResultMap.has

</td></tr>
<tr><td>

[keys()](./IReadOnlyValidatingLibrary.keys.md)

</td><td>



</td><td>

Collections.ResultMap.keys

</td></tr>
<tr><td>

[values()](./IReadOnlyValidatingLibrary.values.md)

</td><td>



</td><td>

Collections.ResultMap.values

</td></tr>
<tr><td>

[[iterator]()](./IReadOnlyValidatingLibrary._iterator_.md)

</td><td>



</td><td>

Gets an iterator over the map entries.

</td></tr>
</tbody></table>
