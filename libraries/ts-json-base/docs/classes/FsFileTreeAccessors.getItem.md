[Home](../README.md) > [FsFileTreeAccessors](./FsFileTreeAccessors.md) > getItem

## FsFileTreeAccessors.getItem() method

Gets an item from the file tree.

**Signature:**

```typescript
getItem(itemPath: string): Result<FileTreeItem<TCT>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>itemPath</td><td>string</td><td>Path of the item to get.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[FileTreeItem](../type-aliases/FileTreeItem.md)&lt;TCT&gt;&gt;

The item if it exists.
