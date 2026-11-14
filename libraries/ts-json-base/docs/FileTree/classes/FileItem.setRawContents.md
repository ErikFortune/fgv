[Home](../../README.md) > [FileTree](../README.md) > [FileItem](./FileItem.md) > setRawContents

## FileItem.setRawContents() method

Sets the raw contents of the file.

**Signature:**

```typescript
setRawContents(contents: string): Result<string>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>contents</td><td>string</td><td>The string contents to save.</td></tr>
</tbody></table>

**Returns:**

Result&lt;string&gt;

`Success` if the file was saved, or `Failure` with an error message.
