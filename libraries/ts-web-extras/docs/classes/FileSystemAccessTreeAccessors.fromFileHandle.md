[Home](../README.md) > [FileSystemAccessTreeAccessors](./FileSystemAccessTreeAccessors.md) > fromFileHandle

## FileSystemAccessTreeAccessors.fromFileHandle() method

Creates a new FileSystemAccessTreeAccessors instance from a single file handle.

The resulting tree contains exactly one file at `/<filename>`.
`syncToDisk()` writes changes back to the original file via the File System Access API.
New file creation is not supported on this tree (no parent directory handle).

**Signature:**

```typescript
static fromFileHandle(fileHandle: FileSystemFileHandle, params?: IFileSystemAccessTreeParams<TCT>): Promise<Result<FileSystemAccessTreeAccessors<TCT>>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>fileHandle</td><td>FileSystemFileHandle</td><td>The FileSystemFileHandle to load.</td></tr>
<tr><td>params</td><td>IFileSystemAccessTreeParams&lt;TCT&gt;</td><td>Optional parameters including autoSync and permission settings.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[FileSystemAccessTreeAccessors](FileSystemAccessTreeAccessors.md)&lt;TCT&gt;&gt;&gt;

Promise resolving to a FileSystemAccessTreeAccessors instance.
