[Home](../README.md) > IJsonEditorRule

# Interface: IJsonEditorRule

An IJsonEditorRule | IJsonEditorRule represents a single configurable
rule to be applied by a JsonEditor | JsonEditor.

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

[editProperty(key, value, state)](./IJsonEditorRule.editProperty.md)

</td><td>



</td><td>

Called by a JsonEditor | JsonEditor to possibly edit one of the properties being

</td></tr>
<tr><td>

[editValue(value, state)](./IJsonEditorRule.editValue.md)

</td><td>



</td><td>

Called by a JsonEditor | JsonEditor to possibly edit a property value or array element.

</td></tr>
<tr><td>

[finalizeProperties(deferred, state)](./IJsonEditorRule.finalizeProperties.md)

</td><td>



</td><td>

Called for each rule after all properties have been merged.

</td></tr>
</tbody></table>
