[Home](../README.md) > [FileTree](./FileTree.md) > create

## FileTree.create() method

Creates a new FileTree instance with the supplied
accessors.

**Signature:**

```typescript
static create(hal: IFileTreeAccessors<TCT>): Result<FileTree<TCT>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>hal</td><td>IFileTreeAccessors&lt;TCT&gt;</td><td>The FileTree.IFileTreeAccessors | accessors to use for
file system operations.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[FileTree](FileTree.md)&lt;TCT&gt;&gt;
