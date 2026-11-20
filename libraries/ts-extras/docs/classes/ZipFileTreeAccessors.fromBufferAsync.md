[Home](../README.md) > [ZipFileTreeAccessors](./ZipFileTreeAccessors.md) > fromBufferAsync

## ZipFileTreeAccessors.fromBufferAsync() method

Creates a new ZipFileTreeAccessors instance from a ZIP file buffer (asynchronous).

**Signature:**

```typescript
static fromBufferAsync(zipBuffer: ArrayBuffer | Uint8Array<ArrayBufferLike>, prefix?: string): Promise<Result<ZipFileTreeAccessors<TCT>>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>zipBuffer</td><td>ArrayBuffer | Uint8Array&lt;ArrayBufferLike&gt;</td><td>The ZIP file as an ArrayBuffer or Uint8Array.</td></tr>
<tr><td>prefix</td><td>string</td><td>Optional prefix to prepend to paths.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[ZipFileTreeAccessors](ZipFileTreeAccessors.md)&lt;TCT&gt;&gt;&gt;

Promise containing Result with the ZipFileTreeAccessors instance.
