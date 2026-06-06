[Home](../README.md) > [FileTree](./FileTree.md) > getFile

## FileTree.getFile() method

Gets a file item from the tree.

**Signature:**

```typescript
getFile(filePath: string): Result<IFileTreeFileItem<TCT>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>filePath</td><td>string</td><td>The path to the file.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IFileTreeFileItem](../interfaces/IFileTreeFileItem.md)&lt;TCT&gt;&gt;

`Success` with the FileTree.IFileTreeFileItem | file item
if successful, or `Failure` with an error message otherwise.
