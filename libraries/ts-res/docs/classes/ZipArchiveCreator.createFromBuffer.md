[Home](../README.md) > [ZipArchiveCreator](./ZipArchiveCreator.md) > createFromBuffer

## ZipArchiveCreator.createFromBuffer() method

Create a ZIP archive buffer from a supplied buffer

**Signature:**

```typescript
createFromBuffer(options: ZipArchiveOptions, onProgress?: ZipArchiveProgressCallback): Promise<Result<IZipArchiveResult>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>options</td><td>ZipArchiveOptions</td><td>Input paths and configuration</td></tr>
<tr><td>onProgress</td><td>ZipArchiveProgressCallback</td><td>Optional progress callback</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[IZipArchiveResult](../interfaces/IZipArchiveResult.md)&gt;&gt;

Result containing ZIP buffer and manifest
