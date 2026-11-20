[Home](../../README.md) > [EditorRules](../README.md) > [ReferenceJsonEditorRule](./ReferenceJsonEditorRule.md) > editValue

## ReferenceJsonEditorRule.editValue() method

Evaluates a property, array or literal value for reference replacement.

**Signature:**

```typescript
editValue(value: JsonValue, state: JsonEditorState): DetailedResult<JsonValue, JsonEditFailureReason>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>value</td><td>JsonValue</td><td>The `JsonValue` of the property to be considered.</td></tr>
<tr><td>state</td><td>JsonEditorState</td><td>The JsonEditorState | editor state for the object being edited.</td></tr>
</tbody></table>

**Returns:**

DetailedResult&lt;JsonValue, [JsonEditFailureReason](../../type-aliases/JsonEditFailureReason.md)&gt;
