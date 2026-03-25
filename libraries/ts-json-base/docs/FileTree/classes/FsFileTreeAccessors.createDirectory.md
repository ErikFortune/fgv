[Home](../../README.md) > [FileTree](../README.md) > [FsFileTreeAccessors](./FsFileTreeAccessors.md) > createDirectory

## FsFileTreeAccessors.createDirectory() method

Creates a directory at the given path, including any missing parent directories.

**Signature:**

```typescript
createDirectory(dirPath: string): Result<string>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>dirPath</td><td>string</td><td>The path of the directory to create.</td></tr>
</tbody></table>

**Returns:**

Result&lt;string&gt;

`Success` with the absolute path if created, or `Failure` with an error message.
