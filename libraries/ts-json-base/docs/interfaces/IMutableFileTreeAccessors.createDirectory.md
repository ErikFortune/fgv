[Home](../README.md) > [IMutableFileTreeAccessors](./IMutableFileTreeAccessors.md) > createDirectory

## IMutableFileTreeAccessors.createDirectory() method

Creates a directory at the given path, including any missing parent directories.

**Signature:**

```typescript
createDirectory(path: string): Result<string>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>path</td><td>string</td><td>The path of the directory to create.</td></tr>
</tbody></table>

**Returns:**

Result&lt;string&gt;

`Success` with the absolute path if created, or `Failure` with an error message.
