[Home](../../README.md) > [FileTree](../README.md) > [FsFileTreeAccessors](./FsFileTreeAccessors.md) > getFileContentType

## FsFileTreeAccessors.getFileContentType() method

Gets the content type of a file in the file tree.

**Signature:**

```typescript
getFileContentType(filePath: string, provided?: string): Result<TCT | undefined>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>filePath</td><td>string</td><td>Absolute path of the file.</td></tr>
<tr><td>provided</td><td>string</td><td>Optional supplied content type.</td></tr>
</tbody></table>

**Returns:**

Result&lt;TCT | undefined&gt;

The content type of the file.
