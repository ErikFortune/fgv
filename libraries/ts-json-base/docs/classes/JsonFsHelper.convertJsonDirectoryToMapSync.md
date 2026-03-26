[Home](../README.md) > [JsonFsHelper](./JsonFsHelper.md) > convertJsonDirectoryToMapSync

## JsonFsHelper.convertJsonDirectoryToMapSync() method

Reads and converts or validates all JSON files from a directory, returning a
`Map<string, T>` indexed by file base name (i.e. minus the extension)
with an optional name transformation applied if present.

**Signature:**

```typescript
convertJsonDirectoryToMapSync(srcPath: string, options: IJsonFsDirectoryToMapOptions<T, TC>, context?: unknown): Result<Map<string, T>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>srcPath</td><td>string</td><td>The path of the folder to be read.</td></tr>
<tr><td>options</td><td>IJsonFsDirectoryToMapOptions&lt;T, TC&gt;</td><td>JsonFile.IJsonFsDirectoryToMapOptions | Options to control conversion,
filtering and naming.</td></tr>
<tr><td>context</td><td>unknown</td><td></td></tr>
</tbody></table>

**Returns:**

Result&lt;Map&lt;string, T&gt;&gt;
