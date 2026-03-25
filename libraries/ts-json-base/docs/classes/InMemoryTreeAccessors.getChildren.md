[Home](../README.md) > [InMemoryTreeAccessors](./InMemoryTreeAccessors.md) > getChildren

## InMemoryTreeAccessors.getChildren() method

Gets the children of a directory in the file tree.

**Signature:**

```typescript
getChildren(path: string): Result<readonly FileTreeItem<TCT>[]>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>path</td><td>string</td><td>Path of the directory.</td></tr>
</tbody></table>

**Returns:**

Result&lt;readonly [FileTreeItem](../type-aliases/FileTreeItem.md)&lt;TCT&gt;[]&gt;

The children of the directory.
