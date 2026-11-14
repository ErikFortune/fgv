[Home](../../README.md) > [FileTree](../README.md) > [InMemoryTreeAccessors](./InMemoryTreeAccessors.md) > create

## InMemoryTreeAccessors.create() method

Creates a new FileTree.InMemoryTreeAccessors | InMemoryTreeAccessors instance with the supplied
in-memory files.

**Signature:**

```typescript
static create(files: IInMemoryFile<TCT>[], prefix?: string): Result<InMemoryTreeAccessors<TCT>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>files</td><td>IInMemoryFile&lt;TCT&gt;[]</td><td>An array of FileTree.IInMemoryFile | in-memory files to include in the tree.</td></tr>
<tr><td>prefix</td><td>string</td><td>Optional prefix for the tree.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[InMemoryTreeAccessors](../../classes/InMemoryTreeAccessors.md)&lt;TCT&gt;&gt;
