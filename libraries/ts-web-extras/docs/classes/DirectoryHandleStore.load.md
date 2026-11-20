[Home](../README.md) > [DirectoryHandleStore](./DirectoryHandleStore.md) > load

## DirectoryHandleStore.load() method

Retrieves a directory handle by label.

**Signature:**

```typescript
load(label: string): Promise<Result<FileSystemDirectoryHandle | undefined>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>label</td><td>string</td><td>Key to look up</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[FileSystemDirectoryHandle](../interfaces/FileSystemDirectoryHandle.md) | undefined&gt;&gt;

Success with handle (or undefined if not found), or Failure on error
