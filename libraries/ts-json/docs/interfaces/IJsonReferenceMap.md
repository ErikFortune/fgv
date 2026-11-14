[Home](../README.md) > IJsonReferenceMap

# Interface: IJsonReferenceMap

Interface for a simple map that returns named `JsonValue` values with templating,
conditional logic, and external reference lookups applied using an optionally supplied context.

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

[keyIsInRange(key)](./IJsonReferenceMap.keyIsInRange.md)

</td><td>



</td><td>

Determine if a key might be valid for this map but does not determine if key actually
exists.

</td></tr>
<tr><td>

[has(key)](./IJsonReferenceMap.has.md)

</td><td>



</td><td>

Determines if an object with the specified key actually exists in the map.

</td></tr>
<tr><td>

[getJsonObject(key, context)](./IJsonReferenceMap.getJsonObject.md)

</td><td>



</td><td>

Gets a `JsonObject` specified by key.

</td></tr>
<tr><td>

[getJsonValue(key, context)](./IJsonReferenceMap.getJsonValue.md)

</td><td>



</td><td>

Gets a `JsonValue` specified by key.

</td></tr>
</tbody></table>
