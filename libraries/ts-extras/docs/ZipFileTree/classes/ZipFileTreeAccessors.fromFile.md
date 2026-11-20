[Home](../../README.md) > [ZipFileTree](../README.md) > [ZipFileTreeAccessors](./ZipFileTreeAccessors.md) > fromFile

## ZipFileTreeAccessors.fromFile() method

Creates a new ZipFileTreeAccessors instance from a File object (browser environment).

**Signature:**

```typescript
static fromFile(file: File, params?: IFileTreeInitParams<TCT>): Promise<Result<ZipFileTreeAccessors<TCT>>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>file</td><td>File</td><td>The File object containing ZIP data.</td></tr>
<tr><td>params</td><td>IFileTreeInitParams&lt;TCT&gt;</td><td>Optional initialization parameters.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[ZipFileTreeAccessors](../../classes/ZipFileTreeAccessors.md)&lt;TCT&gt;&gt;&gt;

Result containing the ZipFileTreeAccessors instance.
