[Home](../../README.md) > [FileTree](../README.md) > [IMutableBinaryFileTreeFileItem](./IMutableBinaryFileTreeFileItem.md) > setRawBytes

## IMutableBinaryFileTreeFileItem.setRawBytes() method

Sets the raw contents of the file from bytes, with no text encoding applied.

**Signature:**

```typescript
setRawBytes(bytes: Uint8Array): Result<Uint8Array<ArrayBufferLike>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>bytes</td><td>Uint8Array</td><td>The bytes to save.</td></tr>
</tbody></table>

**Returns:**

Result&lt;Uint8Array&lt;ArrayBufferLike&gt;&gt;

`Success` with the bytes that were saved, or `Failure` with an error message.
