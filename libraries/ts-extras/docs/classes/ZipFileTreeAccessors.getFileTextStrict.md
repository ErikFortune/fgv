[Home](../README.md) > [ZipFileTreeAccessors](./ZipFileTreeAccessors.md) > getFileTextStrict

## ZipFileTreeAccessors.getFileTextStrict() method

Gets the contents of a file in the file tree, decoding UTF-8 strictly.

**Signature:**

```typescript
getFileTextStrict(path: string): Result<string>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>path</td><td>string</td><td>Absolute path of the entry.</td></tr>
</tbody></table>

**Returns:**

Result&lt;string&gt;

`Success` with the decoded text; `Failure` if the entry's bytes are
not valid UTF-8.
