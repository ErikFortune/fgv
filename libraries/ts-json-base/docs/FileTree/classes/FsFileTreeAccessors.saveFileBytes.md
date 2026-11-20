[Home](../../README.md) > [FileTree](../README.md) > [FsFileTreeAccessors](./FsFileTreeAccessors.md) > saveFileBytes

## FsFileTreeAccessors.saveFileBytes() method

Saves bytes to a file at the given path, with no text encoding applied.

**Signature:**

```typescript
saveFileBytes(path: string, bytes: Uint8Array): Result<Uint8Array<ArrayBufferLike>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>path</td><td>string</td><td>The path of the file to save.</td></tr>
<tr><td>bytes</td><td>Uint8Array</td><td>The bytes to save.</td></tr>
</tbody></table>

**Returns:**

Result&lt;Uint8Array&lt;ArrayBufferLike&gt;&gt;

`Success` with the bytes that were saved, or `Failure` with an error message.
