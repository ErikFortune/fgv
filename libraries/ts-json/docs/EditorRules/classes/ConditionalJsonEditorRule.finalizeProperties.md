[Home](../../README.md) > [EditorRules](../README.md) > [ConditionalJsonEditorRule](./ConditionalJsonEditorRule.md) > finalizeProperties

## ConditionalJsonEditorRule.finalizeProperties() method

Finalizes any deferred conditional properties. If the only deferred property is
default, that property is emitted. Otherwise all matching properties are emitted.

**Signature:**

```typescript
finalizeProperties(finalized: JsonObject[], __state: JsonEditorState): DetailedResult<JsonObject[], JsonEditFailureReason>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>finalized</td><td>JsonObject[]</td><td>The deferred properties to be considered for merge.</td></tr>
<tr><td>__state</td><td>JsonEditorState</td><td>The JsonEditorState | editor state for the object
being edited.</td></tr>
</tbody></table>

**Returns:**

DetailedResult&lt;JsonObject[], [JsonEditFailureReason](../../type-aliases/JsonEditFailureReason.md)&gt;
