[Home](../README.md) > [JsonEditor](./JsonEditor.md) > clone

## JsonEditor.clone() method

Deep clones a supplied `JsonValue`, applying all editor rules and a default
or optionally supplied context

**Signature:**

```typescript
clone(src: JsonValue, context?: IJsonContext): DetailedResult<JsonValue, JsonEditFailureReason>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>src</td><td>JsonValue</td><td>The `JsonValue` to be cloned.</td></tr>
<tr><td>context</td><td>IJsonContext</td><td>An optional IJsonContext | JSON context supplying variables and references.</td></tr>
</tbody></table>

**Returns:**

DetailedResult&lt;JsonValue, [JsonEditFailureReason](../type-aliases/JsonEditFailureReason.md)&gt;
