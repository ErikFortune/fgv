[Home](../../README.md) > [JsonFile](../README.md) > [JsonTreeHelper](./JsonTreeHelper.md) > convertJsonFromTree

## JsonTreeHelper.convertJsonFromTree() method

Read a JSON file from a FileTree and apply a supplied converter or validator.

**Signature:**

```typescript
convertJsonFromTree(fileTree: FileTree, filePath: string, cv: Converter<T, TC> | Validator<T, TC>, context?: TC): Result<T>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>fileTree</td><td>FileTree</td><td>The FileTree to read from</td></tr>
<tr><td>filePath</td><td>string</td><td>Path of the file to read within the tree</td></tr>
<tr><td>cv</td><td>Converter&lt;T, TC&gt; | Validator&lt;T, TC&gt;</td><td>Converter or validator used to process the file.</td></tr>
<tr><td>context</td><td>TC</td><td>Optional context for the converter/validator</td></tr>
</tbody></table>

**Returns:**

Result&lt;T&gt;

`Success` with a result of type `<T>`, or `Failure`
with a message if an error occurs.
