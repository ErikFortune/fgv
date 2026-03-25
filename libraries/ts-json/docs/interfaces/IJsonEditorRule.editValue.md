[Home](../README.md) > [IJsonEditorRule](./IJsonEditorRule.md) > editValue

## IJsonEditorRule.editValue() method

Called by a JsonEditor | JsonEditor to possibly edit a property value or array element.

**Signature:**

```typescript
editValue(value: JsonValue, state: JsonEditorState): DetailedResult<JsonValue, JsonEditFailureReason>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>value</td><td>JsonValue</td><td>The `JsonValue` of the property to be edited.</td></tr>
<tr><td>state</td><td>JsonEditorState</td><td>JsonEditorState | Editor state which applies to the edit.</td></tr>
</tbody></table>

**Returns:**

DetailedResult&lt;JsonValue, [JsonEditFailureReason](../type-aliases/JsonEditFailureReason.md)&gt;

Returns `Success` with the `JsonValue` to be inserted, with detail `'edited'` if
the value was edited.  Returns `Failure` with `'inapplicable'` if the rule does not affect this value.
Fails with detail `'ignore'` if the value is to be ignored, or with `'error'` if an error occurs.
