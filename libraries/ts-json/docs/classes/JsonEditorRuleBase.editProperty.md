[Home](../README.md) > [JsonEditorRuleBase](./JsonEditorRuleBase.md) > editProperty

## JsonEditorRuleBase.editProperty() method

Called by a JsonEditor | JsonEditor to possibly edit one of the properties being
merged into a target object.

**Signature:**

```typescript
editProperty(__key: string, __value: JsonValue, __state: JsonEditorState): DetailedResult<JsonObject, JsonPropertyEditFailureReason>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>__key</td><td>string</td><td>The key of the property to be edited.</td></tr>
<tr><td>__value</td><td>JsonValue</td><td>The `JsonValue` of the property to be edited.</td></tr>
<tr><td>__state</td><td>JsonEditorState</td><td>JsonEditorState | Editor state which applies to the edit.</td></tr>
</tbody></table>

**Returns:**

DetailedResult&lt;JsonObject, [JsonPropertyEditFailureReason](../type-aliases/JsonPropertyEditFailureReason.md)&gt;

If the property was edited, returns `Success` with a `JsonObject` containing
the edited results and with detail `'edited'`. If this property should be deferred for later consideration
or merge, `Success` with detail `'deferred'` and a `JsonObject` to be finalized.  If
the rule does not affect this property, returns `Failure` with detail `'inapplicable'`. If an error occurred
while processing the error, returns `Failure` with detail `'error'`.
