[Home](../../README.md) > [FileTree](../README.md) > [FsFileTreeAccessors](./FsFileTreeAccessors.md) > deleteDirectory

## FsFileTreeAccessors.deleteDirectory() method

Deletes a directory at the given path.
The directory must be empty or the operation will fail.

**Signature:**

```typescript
deleteDirectory(dirPath: string): Result<boolean>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>dirPath</td><td>string</td><td>The path of the directory to delete.</td></tr>
</tbody></table>

**Returns:**

Result&lt;boolean&gt;

`Success` with `true` if the directory was deleted, or `Failure` with an error message.
