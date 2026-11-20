[Home](../../README.md) > [EditorRules](../README.md) > IConditionalJsonDeferredObject

# Interface: IConditionalJsonDeferredObject

On a successful match, the EditorRules.ConditionalJsonEditorRule | ConditionalJsonEditorRule
stores a EditorRules.IConditionalJsonDeferredObject | IConditionalJsonDeferredObject describing the
matching result, to be resolved at finalization time.

**Extends:** [`IConditionalJsonKeyResult`](../../interfaces/IConditionalJsonKeyResult.md)

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

[value](./IConditionalJsonDeferredObject.value.md)

</td><td>



</td><td>

JsonValue

</td><td>



</td></tr>
<tr><td>

[matchType](./IConditionalJsonKeyResult.matchType.md)

</td><td>



</td><td>

"match" | "default" | "unconditional"

</td><td>



</td></tr>
</tbody></table>
