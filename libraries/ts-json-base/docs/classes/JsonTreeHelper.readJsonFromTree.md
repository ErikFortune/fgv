[Home](../README.md) > [JsonTreeHelper](./JsonTreeHelper.md) > readJsonFromTree

## JsonTreeHelper.readJsonFromTree() method

Read type-safe JSON from a file in a FileTree.

**Signature:**

```typescript
readJsonFromTree(fileTree: FileTree, filePath: string): Result<JsonValue>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>fileTree</td><td>FileTree</td><td>The FileTree to read from</td></tr>
<tr><td>filePath</td><td>string</td><td>Path of the file to read within the tree</td></tr>
</tbody></table>

**Returns:**

Result&lt;[JsonValue](../type-aliases/JsonValue.md)&gt;

`Success` with a JsonValue | JsonValue or `Failure`
with a message if an error occurs.
