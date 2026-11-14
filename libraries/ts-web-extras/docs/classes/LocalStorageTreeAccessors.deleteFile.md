[Home](../README.md) > [LocalStorageTreeAccessors](./LocalStorageTreeAccessors.md) > deleteFile

## LocalStorageTreeAccessors.deleteFile() method

Delete a file and remove it from localStorage.

**Signature:**

```typescript
deleteFile(path: string): Result<boolean>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>path</td><td>string</td><td>File path to delete</td></tr>
</tbody></table>

**Returns:**

Result&lt;boolean&gt;

Result with true if deleted, or error
