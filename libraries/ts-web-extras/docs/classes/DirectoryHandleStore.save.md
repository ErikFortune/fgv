[Home](../README.md) > [DirectoryHandleStore](./DirectoryHandleStore.md) > save

## DirectoryHandleStore.save() method

Saves a directory handle to IndexedDB under the given label.

**Signature:**

```typescript
save(label: string, handle: FileSystemDirectoryHandle): Promise<Result<void>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>label</td><td>string</td><td>Key to store the handle under (typically dirHandle.name)</td></tr>
<tr><td>handle</td><td>FileSystemDirectoryHandle</td><td>The FileSystemDirectoryHandle to persist</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;void&gt;&gt;

Success or Failure
