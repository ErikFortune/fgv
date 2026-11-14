[Home](../../README.md) > [JsonFile](../README.md) > [JsonFsHelper](./JsonFsHelper.md) > readJsonFileSync

## JsonFsHelper.readJsonFileSync() method

Read type-safe JSON from a file.

**Signature:**

```typescript
readJsonFileSync(srcPath: string): Result<JsonValue>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>srcPath</td><td>string</td><td>Path of the file to read</td></tr>
</tbody></table>

**Returns:**

Result&lt;[JsonValue](../../type-aliases/JsonValue.md)&gt;

`Success` with a JsonValue | JsonValue or `Failure`
with a message if an error occurs.
