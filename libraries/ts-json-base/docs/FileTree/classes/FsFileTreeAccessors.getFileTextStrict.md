[Home](../../README.md) > [FileTree](../README.md) > [FsFileTreeAccessors](./FsFileTreeAccessors.md) > getFileTextStrict

## FsFileTreeAccessors.getFileTextStrict() method

Reads a file's contents, decoding UTF-8 strictly.

**Signature:**

```typescript
getFileTextStrict(filePath: string): Result<string>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>filePath</td><td>string</td><td>Absolute path of the file.</td></tr>
</tbody></table>

**Returns:**

Result&lt;string&gt;

`Success` with the decoded text; `Failure` if the bytes are not
valid UTF-8.
