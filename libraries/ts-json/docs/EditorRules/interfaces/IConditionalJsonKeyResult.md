[Home](../../README.md) > [EditorRules](../README.md) > IConditionalJsonKeyResult

# Interface: IConditionalJsonKeyResult

Returned by EditorRules.ConditionalJsonEditorRule._tryParseCondition | ConditionalJsonEditorRule._tryParseCondition
to indicate whether a successful match was due to a matching condition or a default value.

**Extends:** `JsonObject`

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

[matchType](./IConditionalJsonKeyResult.matchType.md)

</td><td>



</td><td>

"match" | "default" | "unconditional"

</td><td>



</td></tr>
</tbody></table>
