[Home](../../README.md) > [EditorRules](../README.md) > ConditionalJsonEditorRule

# Class: ConditionalJsonEditorRule

The EditorRules.ConditionalJsonEditorRule | ConditionalJsonEditorRule evaluates
properties with conditional keys, omitting non-matching keys and merging keys that match,
or default keys only if no other keys match.

The default syntax for a conditional key is:
   "?value1=value2" - matches if value1 and value2 are the same, is ignored otherwise.
   "?value" - matches if value is a non-empty, non-whitespace string. Is ignored otherwise.
   "?default" - matches only if no other conditional blocks in the same object were matched.

**Extends:** [`JsonEditorRuleBase`](../../classes/JsonEditorRuleBase.md)

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

`constructor(options)`

</td><td>



</td><td>

Creates a new EditorRules.ConditionalJsonEditorRule | ConditionalJsonEditorRule.

</td></tr>
</tbody></table>

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

[_options](./ConditionalJsonEditorRule._options.md)

</td><td>



</td><td>

[IConditionalJsonRuleOptions](../../interfaces/IConditionalJsonRuleOptions.md)

</td><td>

Stored fully-resolved EditorRules.IConditionalJsonRuleOptions | options for this

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

[create(options)](./ConditionalJsonEditorRule.create.md)

</td><td>

`static`

</td><td>

Creates a new EditorRules.ConditionalJsonEditorRule | ConditionalJsonEditorRule.

</td></tr>
<tr><td>

[editProperty(key, value, state)](./ConditionalJsonEditorRule.editProperty.md)

</td><td>



</td><td>

Evaluates a property for conditional application.

</td></tr>
<tr><td>

[finalizeProperties(finalized, __state)](./ConditionalJsonEditorRule.finalizeProperties.md)

</td><td>



</td><td>

Finalizes any deferred conditional properties.

</td></tr>
<tr><td>

[_tryParseCondition(key, state)](./ConditionalJsonEditorRule._tryParseCondition.md)

</td><td>



</td><td>

Determines if a given property key is conditional.

</td></tr>
<tr><td>

[editValue(__value, __state)](./JsonEditorRuleBase.editValue.md)

</td><td>



</td><td>

IJsonEditorRule.editValue

</td></tr>
</tbody></table>
