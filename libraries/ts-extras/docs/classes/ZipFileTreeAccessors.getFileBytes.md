[Home](../README.md) > [ZipFileTreeAccessors](./ZipFileTreeAccessors.md) > getFileBytes

## ZipFileTreeAccessors.getFileBytes() method

Gets the raw bytes of a ZIP entry, with no text decoding applied.

**Signature:**

```typescript
getFileBytes(path: string): Result<Uint8Array<ArrayBufferLike>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>path</td><td>string</td><td></td></tr>
</tbody></table>

**Returns:**

Result&lt;Uint8Array&lt;ArrayBufferLike&gt;&gt;
