[Home](../README.md) > [TemplatedJsonEditorRule](./TemplatedJsonEditorRule.md) > editValue

## TemplatedJsonEditorRule.editValue() method

Evaluates a property, array or literal value for template rendering.

**Signature:**

```typescript
editValue(value: JsonValue, state: JsonEditorState): DetailedResult<JsonValue, JsonEditFailureReason>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>value</td><td>JsonValue</td><td>The `JsonValue` to be edited.</td></tr>
<tr><td>state</td><td>JsonEditorState</td><td>The JsonEditorState | editor state for the object being edited.</td></tr>
</tbody></table>

**Returns:**

DetailedResult&lt;JsonValue, [JsonEditFailureReason](../type-aliases/JsonEditFailureReason.md)&gt;

`Success` with detail `'edited'` if the value contained a template and was edited.
Returns `Failure` with `'ignore'` if the rendered value should be ignored, with `'error'` if
an error occurs, or with `'inapplicable'` if the value was not a string with a template.
