[Home](../README.md) > TemplatedJsonEditorRule

# Class: TemplatedJsonEditorRule

The EditorRules.TemplatedJsonEditorRule | Templated JSON editor rule applies mustache rendering as
appropriate to any keys or values in the object being edited.

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

Creates a new EditorRules.TemplatedJsonEditorRule | TemplatedJsonEditorRule.

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

[_options](./TemplatedJsonEditorRule._options.md)

</td><td>



</td><td>

[ITemplatedJsonRuleOptions](../interfaces/ITemplatedJsonRuleOptions.md)

</td><td>

Fully-resolved EditorRules.ITemplatedJsonRuleOptions | configuration options for this rule.

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

[create(options)](./TemplatedJsonEditorRule.create.md)

</td><td>

`static`

</td><td>

Creates a new EditorRules.TemplatedJsonEditorRule | TemplatedJsonEditorRule.

</td></tr>
<tr><td>

[editProperty(key, value, state)](./TemplatedJsonEditorRule.editProperty.md)

</td><td>



</td><td>

Evaluates a property name for template rendering.

</td></tr>
<tr><td>

[editValue(value, state)](./TemplatedJsonEditorRule.editValue.md)

</td><td>



</td><td>

Evaluates a property, array or literal value for template rendering.

</td></tr>
<tr><td>

[finalizeProperties(__deferred, __state)](./JsonEditorRuleBase.finalizeProperties.md)

</td><td>



</td><td>

Called for each rule after all properties have been merged.

</td></tr>
</tbody></table>
