[Home](../README.md) > [ZipArchiveLoader](./ZipArchiveLoader.md) > loadFromBuffer

## ZipArchiveLoader.loadFromBuffer() method

Load ZIP archive from ArrayBuffer (Universal)

**Signature:**

```typescript
loadFromBuffer(buffer: ArrayBuffer, options: IZipArchiveLoadOptions, onProgress?: ZipArchiveProgressCallback): Promise<Result<IZipArchiveLoadResult>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>buffer</td><td>ArrayBuffer</td><td>ZIP data buffer</td></tr>
<tr><td>options</td><td>IZipArchiveLoadOptions</td><td>Loading options</td></tr>
<tr><td>onProgress</td><td>ZipArchiveProgressCallback</td><td>Optional progress callback</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[IZipArchiveLoadResult](../interfaces/IZipArchiveLoadResult.md)&gt;&gt;

Result containing loaded archive data
