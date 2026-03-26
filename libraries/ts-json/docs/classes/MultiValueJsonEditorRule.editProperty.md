[Home](../README.md) > [MultiValueJsonEditorRule](./MultiValueJsonEditorRule.md) > editProperty

## MultiValueJsonEditorRule.editProperty() method

Evaluates a property for multi-value expansion.

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

DetailedResult&lt;JsonObject, [JsonPropertyEditFailureReason](../type-aliases/JsonPropertyEditFailureReason.md)&gt;

`Success` with an object containing the fully-resolved child values to be merged for
matching multi-value property. Returns `Failure` with detail `'error'` if an error occurs or
with detail `'inapplicable'` if the property key is not a conditional property.
