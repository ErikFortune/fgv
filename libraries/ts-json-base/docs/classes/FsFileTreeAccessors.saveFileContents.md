[Home](../README.md) > [FsFileTreeAccessors](./FsFileTreeAccessors.md) > saveFileContents

## FsFileTreeAccessors.saveFileContents() method

Saves the contents to a file at the given path.

**Signature:**

```typescript
saveFileContents(path: string, contents: string): Result<string>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>path</td><td>string</td><td>The path of the file to save.</td></tr>
<tr><td>contents</td><td>string</td><td>The string contents to save.</td></tr>
</tbody></table>

**Returns:**

Result&lt;string&gt;

`Success` if the file was saved, or `Failure` with an error message.
