[Home](../README.md) > [FileTree](./FileTree.md) > getItem

## FileTree.getItem() method

Gets an item from the tree.

**Signature:**

```typescript
getItem(itemPath: string): Result<FileTreeItem<TCT>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>itemPath</td><td>string</td><td>The path to the item.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[FileTreeItem](../type-aliases/FileTreeItem.md)&lt;TCT&gt;&gt;

`Success` with the item if successful,
or `Failure` with an error message otherwise.
