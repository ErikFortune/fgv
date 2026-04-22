[Home](../README.md) > ReferenceJsonEditorRule

# Class: ReferenceJsonEditorRule

The EditorRules.ReferenceJsonEditorRule | Reference JSON editor rule replaces property
keys or values that match some known object with a copy of that referenced object, formatted
according to the current context.

A property key is matched if it matches any known referenced value.
- If the value of the matched key is `'default'`, then the entire object is formatted
  with the current context, flattened and merged into the current object.
- If the value of the matched key is some other string, then the entire
  object is formatted with the current context, and the child of the resulting
  object at the specified path is flattened and merged into the current object.
- If the value of the matched key is an object, then the entire object is
  formatted with the current context extended to include any properties of
  that object, flattened, and merged into the current object.
- It is an error if the referenced value is not an object.

Any property, array or literal value is matched if it matches any known
value reference. The referenced value is replaced by the referenced
value, formatted using the current editor context.

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

Creates a new EditorRules.ReferenceJsonEditorRule | ReferenceJsonEditorRule.

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

[_options](./ReferenceJsonEditorRule._options.md)

</td><td>



</td><td>

[IJsonEditorOptions](../interfaces/IJsonEditorOptions.md)

</td><td>

Stored fully-resolved IJsonEditorOptions | editor options for this rule.

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

[create(options)](./ReferenceJsonEditorRule.create.md)

</td><td>

`static`

</td><td>

Creates a new EditorRules.ReferenceJsonEditorRule | ReferenceJsonEditorRule.

</td></tr>
<tr><td>

[editProperty(key, value, state)](./ReferenceJsonEditorRule.editProperty.md)

</td><td>



</td><td>

Evaluates a property for reference expansion.

</td></tr>
<tr><td>

[editValue(value, state)](./ReferenceJsonEditorRule.editValue.md)

</td><td>



</td><td>

Evaluates a property, array or literal value for reference replacement.

</td></tr>
<tr><td>

[finalizeProperties(__deferred, __state)](./JsonEditorRuleBase.finalizeProperties.md)

</td><td>



</td><td>

Called for each rule after all properties have been merged.

</td></tr>
</tbody></table>
