[Home](../README.md) > [FsFileTreeAccessors](./FsFileTreeAccessors.md) > getChildren

## FsFileTreeAccessors.getChildren() method

Gets the children of a directory in the file tree.

**Signature:**

```typescript
getChildren(dirPath: string): Result<readonly FileTreeItem<TCT>[]>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>dirPath</td><td>string</td><td>Path of the directory.</td></tr>
</tbody></table>

**Returns:**

Result&lt;readonly [FileTreeItem](../type-aliases/FileTreeItem.md)&lt;TCT&gt;[]&gt;

The children of the directory.
