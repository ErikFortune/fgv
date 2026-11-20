[Home](../README.md) > MultiValueJsonEditorRule

# Class: MultiValueJsonEditorRule

The EditorRules.MultiValueJsonEditorRule | Multi-Value JSON editor rule
expands matching keys multiple times, projecting the value into the template
context for any child objects rendered by the rule.

The default syntax for a multi-value key is:
 "[[var]]=value1,value2,value3"
Where "var" is the name of the variable that will be passed to
child template resolution, and "value1,value2,value3" is a
comma-separated list of values to be expanded.

**Extends:** [`JsonEditorRuleBase`](JsonEditorRuleBase.md)

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

Creates a new EditorRules.MultiValueJsonEditorRule | MultiValueJsonEditorRule.

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

[_options](./MultiValueJsonEditorRule._options.md)

</td><td>



</td><td>

[IJsonEditorOptions](../interfaces/IJsonEditorOptions.md)

</td><td>

Stored fully-resolved IJsonEditorOptions | editor options

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

[create(options)](./MultiValueJsonEditorRule.create.md)

</td><td>

`static`

</td><td>

Creates a new EditorRules.MultiValueJsonEditorRule | MultiValueJsonEditorRule.

</td></tr>
<tr><td>

[editProperty(key, value, state)](./MultiValueJsonEditorRule.editProperty.md)

</td><td>



</td><td>

Evaluates a property for multi-value expansion.

</td></tr>
<tr><td>

[_deriveContext(state, values)](./MultiValueJsonEditorRule._deriveContext.md)

</td><td>



</td><td>

Extends the IJsonContext | current context with a supplied state and values.

</td></tr>
<tr><td>

[_tryParse(token, state)](./MultiValueJsonEditorRule._tryParse.md)

</td><td>



</td><td>

Determines if a given property key is multi-value.

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
