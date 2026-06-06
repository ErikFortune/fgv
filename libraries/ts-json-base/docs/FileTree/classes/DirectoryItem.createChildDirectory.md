[Home](../../README.md) > [FileTree](../README.md) > [DirectoryItem](./DirectoryItem.md) > createChildDirectory

## DirectoryItem.createChildDirectory() method

Creates a new subdirectory as a child of this directory.

**Signature:**

```typescript
createChildDirectory(name: string): Result<IMutableFileTreeDirectoryItem<TCT>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>string</td><td>The directory name to create.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IMutableFileTreeDirectoryItem](../../interfaces/IMutableFileTreeDirectoryItem.md)&lt;TCT&gt;&gt;

`Success` with the new directory item, or `Failure` with an error message.
