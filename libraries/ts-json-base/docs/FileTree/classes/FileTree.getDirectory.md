[Home](../../README.md) > [FileTree](../README.md) > [FileTree](./FileTree.md) > getDirectory

## FileTree.getDirectory() method

Gets a directory item from the tree.

**Signature:**

```typescript
getDirectory(directoryPath: string): Result<IFileTreeDirectoryItem<TCT>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>directoryPath</td><td>string</td><td>The path to the directory.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IFileTreeDirectoryItem](../../interfaces/IFileTreeDirectoryItem.md)&lt;TCT&gt;&gt;

`Success` with the FileTree.IFileTreeDirectoryItem | directory item
if successful, or `Failure` with an error message otherwise.
