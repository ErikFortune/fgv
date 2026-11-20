[Home](../README.md) > [IJsonCloneEditor](./IJsonCloneEditor.md) > clone

## IJsonCloneEditor.clone() method

Returns a deep clone of a supplied `JsonValue`.

**Signature:**

```typescript
clone(src: JsonValue, context?: IJsonContext): DetailedResult<JsonValue, JsonEditFailureReason>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>src</td><td>JsonValue</td><td>The `JsonValue` to be cloned.</td></tr>
<tr><td>context</td><td>IJsonContext</td><td>An optional IJsonContext | JSON context used for clone
conversion operations.</td></tr>
</tbody></table>

**Returns:**

DetailedResult&lt;JsonValue, [JsonEditFailureReason](../type-aliases/JsonEditFailureReason.md)&gt;
