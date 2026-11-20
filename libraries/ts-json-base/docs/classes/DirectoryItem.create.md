[Home](../README.md) > [DirectoryItem](./DirectoryItem.md) > create

## DirectoryItem.create() method

Creates a new DirectoryItem instance.

**Signature:**

```typescript
static create(path: string, hal: IFileTreeAccessors<TCT>): Result<DirectoryItem<TCT>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>path</td><td>string</td><td>Relative path of the directory.</td></tr>
<tr><td>hal</td><td>IFileTreeAccessors&lt;TCT&gt;</td><td>The FileTree.IFileTreeAccessors | accessors to use for
file system operations.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[DirectoryItem](DirectoryItem.md)&lt;TCT&gt;&gt;

`Success` with the new FileTree.DirectoryItem | DirectoryItem instance if successful,
or `Failure` with an error message otherwise.
