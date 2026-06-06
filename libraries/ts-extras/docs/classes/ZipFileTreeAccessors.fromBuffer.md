[Home](../README.md) > [ZipFileTreeAccessors](./ZipFileTreeAccessors.md) > fromBuffer

## ZipFileTreeAccessors.fromBuffer() method

Creates a new ZipFileTreeAccessors instance from a ZIP file buffer (synchronous).

**Signature:**

```typescript
static fromBuffer(zipBuffer: ArrayBuffer | Uint8Array<ArrayBufferLike>, prefix?: string): Result<ZipFileTreeAccessors<TCT>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>zipBuffer</td><td>ArrayBuffer | Uint8Array&lt;ArrayBufferLike&gt;</td><td>The ZIP file as an ArrayBuffer or Uint8Array.</td></tr>
<tr><td>prefix</td><td>string</td><td>Optional prefix to prepend to paths.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ZipFileTreeAccessors](ZipFileTreeAccessors.md)&lt;TCT&gt;&gt;

Result containing the ZipFileTreeAccessors instance.
