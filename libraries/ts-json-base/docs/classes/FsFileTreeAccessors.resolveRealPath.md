[Home](../README.md) > [FsFileTreeAccessors](./FsFileTreeAccessors.md) > resolveRealPath

## FsFileTreeAccessors.resolveRealPath() method

Resolves a path to its canonical real path, with every symbolic link
resolved. Optional: only storage that has symbolic links (a filesystem)
implements it.

**Signature:**

```typescript
resolveRealPath(itemPath: string): Result<string>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>itemPath</td><td>string</td><td>The path to resolve.</td></tr>
</tbody></table>

**Returns:**

Result&lt;string&gt;

`Success` with the real path, or `Failure` if it cannot be
resolved (for example, it does not exist).
