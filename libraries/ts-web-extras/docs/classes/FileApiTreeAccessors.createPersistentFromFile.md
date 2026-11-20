[Home](../README.md) > [FileApiTreeAccessors](./FileApiTreeAccessors.md) > createPersistentFromFile

## FileApiTreeAccessors.createPersistentFromFile() method

Create a persistent FileTree from a single File System Access API file handle.
The tree contains exactly one file at `/<filename>`.
Changes can be synced back to the original file via `syncToDisk()`.

**Signature:**

```typescript
static createPersistentFromFile(fileHandle: FileSystemFileHandle, params?: IFileSystemAccessTreeParams<TCT>): Promise<Result<FileTree_2<TCT>>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>fileHandle</td><td>FileSystemFileHandle</td><td>FileSystemFileHandle to load</td></tr>
<tr><td>params</td><td>IFileSystemAccessTreeParams&lt;TCT&gt;</td><td>Optional parameters including autoSync and permission settings</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;FileTree_2&lt;TCT&gt;&gt;&gt;

Promise resolving to a FileTree with persistence capability
