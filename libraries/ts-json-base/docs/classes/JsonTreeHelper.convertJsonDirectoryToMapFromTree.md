[Home](../README.md) > [JsonTreeHelper](./JsonTreeHelper.md) > convertJsonDirectoryToMapFromTree

## JsonTreeHelper.convertJsonDirectoryToMapFromTree() method

Reads and converts all JSON files from a directory in a FileTree,
returning a Map indexed by file base name.

**Signature:**

```typescript
convertJsonDirectoryToMapFromTree(fileTree: FileTree, dirPath: string, cv: Converter<T, TC> | Validator<T, TC>, filePattern?: RegExp, context?: TC): Result<Map<string, T>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>fileTree</td><td>FileTree</td><td>The FileTree to read from</td></tr>
<tr><td>dirPath</td><td>string</td><td>The path of the directory within the tree</td></tr>
<tr><td>cv</td><td>Converter&lt;T, TC&gt; | Validator&lt;T, TC&gt;</td><td>Converter or validator to apply to each JSON file</td></tr>
<tr><td>filePattern</td><td>RegExp</td><td>Optional regex pattern to filter files</td></tr>
<tr><td>context</td><td>TC</td><td>Optional context for the converter/validator</td></tr>
</tbody></table>

**Returns:**

Result&lt;Map&lt;string, T&gt;&gt;

Map of basename to converted content
