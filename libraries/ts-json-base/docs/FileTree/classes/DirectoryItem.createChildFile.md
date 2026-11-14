[Home](../../README.md) > [FileTree](../README.md) > [DirectoryItem](./DirectoryItem.md) > createChildFile

## DirectoryItem.createChildFile() method

Creates a new file as a child of this directory.

**Signature:**

```typescript
createChildFile(name: string, contents: string): Result<IMutableFileTreeFileItem<TCT>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>string</td><td>The file name to create.</td></tr>
<tr><td>contents</td><td>string</td><td>The string contents to write.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IMutableFileTreeFileItem](../../interfaces/IMutableFileTreeFileItem.md)&lt;TCT&gt;&gt;

`Success` with the new file item, or `Failure` with an error message.
