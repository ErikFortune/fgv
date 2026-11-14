[Home](../../README.md) > [JsonFile](../README.md) > [JsonFsHelper](./JsonFsHelper.md) > convertJsonDirectorySync

## JsonFsHelper.convertJsonDirectorySync() method

Reads all JSON files from a directory and apply a supplied converter or validator.

**Signature:**

```typescript
convertJsonDirectorySync(srcPath: string, options: IJsonFsDirectoryOptions<T>, context?: TC): Result<IReadDirectoryItem<T>[]>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>srcPath</td><td>string</td><td>The path of the folder to be read.</td></tr>
<tr><td>options</td><td>IJsonFsDirectoryOptions&lt;T&gt;</td><td>JsonFile.IJsonFsDirectoryOptions | Options to control
conversion and filtering</td></tr>
<tr><td>context</td><td>TC</td><td></td></tr>
</tbody></table>

**Returns:**

Result&lt;[IReadDirectoryItem](../../interfaces/IReadDirectoryItem.md)&lt;T&gt;[]&gt;
