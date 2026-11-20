[Home](../README.md) > [IMutableFileTreeFileItem](./IMutableFileTreeFileItem.md) > setContents

## IMutableFileTreeFileItem.setContents() method

Sets the contents of the file from a JSON value.

**Signature:**

```typescript
setContents(json: JsonValue): Result<JsonValue>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>json</td><td>JsonValue</td><td>The JSON value to serialize and save.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[JsonValue](../type-aliases/JsonValue.md)&gt;

`Success` if the file was saved, or `Failure` with an error message.
