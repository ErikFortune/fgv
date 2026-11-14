[Home](../README.md) > EditorRules

# Namespace: EditorRules

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[ConditionalJsonEditorRule](./classes/ConditionalJsonEditorRule.md)

</td><td>

The EditorRules.ConditionalJsonEditorRule | ConditionalJsonEditorRule evaluates
properties with conditional keys, omitting non-matching keys and merging keys that match,
or default keys only if no other keys match.

</td></tr>
<tr><td>

[MultiValueJsonEditorRule](./classes/MultiValueJsonEditorRule.md)

</td><td>

The EditorRules.MultiValueJsonEditorRule | Multi-Value JSON editor rule
expands matching keys multiple times, projecting the value into the template
context for any child objects rendered by the rule.

</td></tr>
<tr><td>

[ReferenceJsonEditorRule](./classes/ReferenceJsonEditorRule.md)

</td><td>

The EditorRules.ReferenceJsonEditorRule | Reference JSON editor rule replaces property
keys or values that match some known object with a copy of that referenced object, formatted
according to the current context.

</td></tr>
<tr><td>

[TemplatedJsonEditorRule](./classes/TemplatedJsonEditorRule.md)

</td><td>

The EditorRules.TemplatedJsonEditorRule | Templated JSON editor rule applies mustache rendering as

</td></tr>
</tbody></table>

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[IConditionalJsonKeyResult](./interfaces/IConditionalJsonKeyResult.md)

</td><td>

Returned by EditorRules.ConditionalJsonEditorRule._tryParseCondition | ConditionalJsonEditorRule._tryParseCondition

</td></tr>
<tr><td>

[IConditionalJsonDeferredObject](./interfaces/IConditionalJsonDeferredObject.md)

</td><td>

On a successful match, the EditorRules.ConditionalJsonEditorRule | ConditionalJsonEditorRule

</td></tr>
<tr><td>

[IConditionalJsonRuleOptions](./interfaces/IConditionalJsonRuleOptions.md)

</td><td>

Configuration options for the EditorRules.ConditionalJsonEditorRule | ConditionalJsonEditorRule.

</td></tr>
<tr><td>

[IMultiValuePropertyParts](./interfaces/IMultiValuePropertyParts.md)

</td><td>

Represents the parts of a multi-value property key.

</td></tr>
<tr><td>

[ITemplatedJsonRuleOptions](./interfaces/ITemplatedJsonRuleOptions.md)

</td><td>

Configuration options for the EditorRules.TemplatedJsonEditorRule | Templated JSON editor rule.

</td></tr>
</tbody></table>
