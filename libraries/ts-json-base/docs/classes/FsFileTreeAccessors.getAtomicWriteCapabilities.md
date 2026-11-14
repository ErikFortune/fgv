[Home](../README.md) > [FsFileTreeAccessors](./FsFileTreeAccessors.md) > getAtomicWriteCapabilities

## FsFileTreeAccessors.getAtomicWriteCapabilities() method

Reports what atomic replacement this store can offer for writes into the
given directory.

**Signature:**

```typescript
getAtomicWriteCapabilities(directory: string): Result<IAtomicWriteCapabilities>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>directory</td><td>string</td><td>Absolute path of the containing directory.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IAtomicWriteCapabilities](../interfaces/IAtomicWriteCapabilities.md)&gt;

`Success` with the store's FileTree.IAtomicWriteCapabilities | capabilities, or `Failure` if the directory does not exist or the path
names a file rather than a directory.
