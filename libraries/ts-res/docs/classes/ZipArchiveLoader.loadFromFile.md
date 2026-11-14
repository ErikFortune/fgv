[Home](../README.md) > [ZipArchiveLoader](./ZipArchiveLoader.md) > loadFromFile

## ZipArchiveLoader.loadFromFile() method

Load ZIP archive from File object (Browser)

**Signature:**

```typescript
loadFromFile(file: File, options: IZipArchiveLoadOptions, onProgress?: ZipArchiveProgressCallback): Promise<Result<IZipArchiveLoadResult>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>file</td><td>File</td><td>File object from file input</td></tr>
<tr><td>options</td><td>IZipArchiveLoadOptions</td><td>Loading options</td></tr>
<tr><td>onProgress</td><td>ZipArchiveProgressCallback</td><td>Optional progress callback</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[IZipArchiveLoadResult](../interfaces/IZipArchiveLoadResult.md)&gt;&gt;

Result containing loaded archive data
