[Home](../README.md) > [DirectoryItem](./DirectoryItem.md) > createChildFileBytes

## DirectoryItem.createChildFileBytes() method

Creates a new file as a child of this directory from raw bytes, with no text
encoding applied.

**Signature:**

```typescript
createChildFileBytes(name: string, bytes: Uint8Array): Result<IMutableFileTreeFileItem<TCT>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>string</td><td>The file name to create.</td></tr>
<tr><td>bytes</td><td>Uint8Array</td><td>The bytes to write.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IMutableFileTreeFileItem](../interfaces/IMutableFileTreeFileItem.md)&lt;TCT&gt;&gt;

`Success` with the new file item, or `Failure` with an error message.
