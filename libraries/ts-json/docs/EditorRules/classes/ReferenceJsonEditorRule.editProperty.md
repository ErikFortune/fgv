[Home](../../README.md) > [EditorRules](../README.md) > [ReferenceJsonEditorRule](./ReferenceJsonEditorRule.md) > editProperty

## ReferenceJsonEditorRule.editProperty() method

Evaluates a property for reference expansion.

**Signature:**

```typescript
editProperty(key: string, value: JsonValue, state: JsonEditorState): DetailedResult<JsonObject, JsonPropertyEditFailureReason>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>string</td><td>The key of the property to be considered.</td></tr>
<tr><td>value</td><td>JsonValue</td><td>The `JsonValue` of the property to be considered.</td></tr>
<tr><td>state</td><td>JsonEditorState</td><td>The JsonEditorState | editor state for the object being edited.</td></tr>
</tbody></table>

**Returns:**

DetailedResult&lt;JsonObject, [JsonPropertyEditFailureReason](../../type-aliases/JsonPropertyEditFailureReason.md)&gt;

If the reference is successful, returns `Success` with a `JsonObject`
to be flattened and merged into the current object. Returns `Failure` with detail `'inapplicable'`
for non-reference keys or with detail `'error'` if an error occurs.
