[Home](../README.md) > JsonEditorRuleBase

# Class: JsonEditorRuleBase

Default base implementation of IJsonEditorRule | IJsonEditorRule returns inapplicable for all operations so that
derived classes need only implement the operations they actually support.

**Implements:** [`IJsonEditorRule`](../interfaces/IJsonEditorRule.md)

## Constructors

<table><thead><tr><th>

Constructor

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

`constructor()`

</td><td>



</td><td>



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

[editProperty(__key, __value, __state)](./JsonEditorRuleBase.editProperty.md)

</td><td>



</td><td>

Called by a JsonEditor | JsonEditor to possibly edit one of the properties being

</td></tr>
<tr><td>

[editValue(__value, __state)](./JsonEditorRuleBase.editValue.md)

</td><td>



</td><td>

Called by a JsonEditor | JsonEditor to possibly edit a property value or array element.

</td></tr>
<tr><td>

[finalizeProperties(__deferred, __state)](./JsonEditorRuleBase.finalizeProperties.md)

</td><td>



</td><td>

Called for each rule after all properties have been merged.

</td></tr>
</tbody></table>
