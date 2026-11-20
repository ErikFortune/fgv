[Home](../README.md) > [FileApiTreeAccessors](./FileApiTreeAccessors.md) > getOriginalFile

## FileApiTreeAccessors.getOriginalFile() method

Get the File object for a specific path from the original FileList.
This is useful for accessing the original File API object for operations
like getting file metadata, MIME type, etc.

**Signature:**

```typescript
static getOriginalFile(fileList: FileList, targetPath: string): Result<File>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>fileList</td><td>FileList</td><td>The original FileList</td></tr>
<tr><td>targetPath</td><td>string</td><td>The path to find</td></tr>
</tbody></table>

**Returns:**

Result&lt;File&gt;

Result containing the File object if found
