[Home](../README.md) > [JsonFsHelper](./JsonFsHelper.md) > writeJsonFileSync

## JsonFsHelper.writeJsonFileSync() method

Write type-safe JSON to a file.

**Signature:**

```typescript
writeJsonFileSync(srcPath: string, value: JsonValue): Result<boolean>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>srcPath</td><td>string</td><td>Path of the file to write.</td></tr>
<tr><td>value</td><td>JsonValue</td><td>The JsonValue | JsonValue to be written.</td></tr>
</tbody></table>

**Returns:**

Result&lt;boolean&gt;
