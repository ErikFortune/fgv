[Home](../../README.md) > [FileTree](../README.md) > [FileItem](./FileItem.md) > create

## FileItem.create() method

Creates a new FileTree.FileItem instance.

**Signature:**

```typescript
static create(path: string, hal: IFileTreeAccessors<TCT>): Result<FileItem<TCT>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>path</td><td>string</td><td>Relative path of the file.</td></tr>
<tr><td>hal</td><td>IFileTreeAccessors&lt;TCT&gt;</td><td>The FileTree.IFileTreeAccessors | accessors to use for
file system operations.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[FileItem](../../classes/FileItem.md)&lt;TCT&gt;&gt;
