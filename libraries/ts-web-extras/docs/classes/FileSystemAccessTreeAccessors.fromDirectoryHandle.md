[Home](../README.md) > [FileSystemAccessTreeAccessors](./FileSystemAccessTreeAccessors.md) > fromDirectoryHandle

## FileSystemAccessTreeAccessors.fromDirectoryHandle() method

Creates a new FileSystemAccessTreeAccessors instance from a directory handle.

**Signature:**

```typescript
static fromDirectoryHandle(dirHandle: FileSystemDirectoryHandle, params?: IFileSystemAccessTreeParams<TCT>): Promise<Result<FileSystemAccessTreeAccessors<TCT>>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>dirHandle</td><td>FileSystemDirectoryHandle</td><td>The FileSystemDirectoryHandle to load files from.</td></tr>
<tr><td>params</td><td>IFileSystemAccessTreeParams&lt;TCT&gt;</td><td>Optional parameters including autoSync and permission settings.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[FileSystemAccessTreeAccessors](FileSystemAccessTreeAccessors.md)&lt;TCT&gt;&gt;&gt;

Promise resolving to a FileSystemAccessTreeAccessors instance.
