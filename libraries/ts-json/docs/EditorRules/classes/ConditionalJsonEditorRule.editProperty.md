[Home](../../README.md) > [EditorRules](../README.md) > [ConditionalJsonEditorRule](./ConditionalJsonEditorRule.md) > editProperty

## ConditionalJsonEditorRule.editProperty() method

Evaluates a property for conditional application.

**Signature:**

```typescript
editProperty(key: string, value: JsonValue, state: JsonEditorState): DetailedResult<JsonObject, JsonPropertyEditFailureReason>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>string</td><td>The key of the property to be considered</td></tr>
<tr><td>value</td><td>JsonValue</td><td>The `JsonValue` of the property to be considered.</td></tr>
<tr><td>state</td><td>JsonEditorState</td><td>The JsonEditorState | editor state for the object being edited.</td></tr>
</tbody></table>

**Returns:**

DetailedResult&lt;JsonObject, [JsonPropertyEditFailureReason](../../type-aliases/JsonPropertyEditFailureReason.md)&gt;

Returns `Success` with detail `'deferred'` and a
EditorRules.IConditionalJsonDeferredObject | IConditionalJsonDeferredObject.
for a matching, default or unconditional key. Returns `Failure` with detail `'ignore'` for
a non-matching conditional, or with detail `'error'` if an error occurs. Otherwise
fails with detail `'inapplicable'`.
