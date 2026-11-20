[Home](../README.md) > [InMemoryTreeAccessors](./InMemoryTreeAccessors.md) > getFileBytes

## InMemoryTreeAccessors.getFileBytes() method

Gets the contents of a file in the file tree as bytes, with no text decoding applied.

**Signature:**

```typescript
getFileBytes(path: string): Result<Uint8Array<ArrayBufferLike>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>path</td><td>string</td><td>Absolute path of the file.</td></tr>
</tbody></table>

**Returns:**

Result&lt;Uint8Array&lt;ArrayBufferLike&gt;&gt;

`Success` with the raw bytes of the file, or `Failure` with an error message.
