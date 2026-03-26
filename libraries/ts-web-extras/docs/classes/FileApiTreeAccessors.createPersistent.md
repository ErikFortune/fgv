[Home](../README.md) > [FileApiTreeAccessors](./FileApiTreeAccessors.md) > createPersistent

## FileApiTreeAccessors.createPersistent() method

Create a persistent FileTree from a File System Access API directory handle.
Changes to files can be synced back to disk.

**Signature:**

```typescript
static createPersistent(dirHandle: FileSystemDirectoryHandle, params?: IFileSystemAccessTreeParams<TCT>): Promise<Result<FileTree_2<TCT>>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>dirHandle</td><td>FileSystemDirectoryHandle</td><td>FileSystemDirectoryHandle to load files from</td></tr>
<tr><td>params</td><td>IFileSystemAccessTreeParams&lt;TCT&gt;</td><td>Optional parameters including autoSync and permission settings</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;FileTree_2&lt;TCT&gt;&gt;&gt;

Promise resolving to a FileTree with persistence capability
