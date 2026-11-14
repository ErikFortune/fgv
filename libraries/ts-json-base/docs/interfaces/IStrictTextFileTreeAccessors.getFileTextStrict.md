[Home](../README.md) > [IStrictTextFileTreeAccessors](./IStrictTextFileTreeAccessors.md) > getFileTextStrict

## IStrictTextFileTreeAccessors.getFileTextStrict() method

Reads a file's contents, decoding UTF-8 strictly.

**Signature:**

```typescript
getFileTextStrict(path: string): Result<string>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>path</td><td>string</td><td>Absolute path of the file.</td></tr>
</tbody></table>

**Returns:**

Result&lt;string&gt;

`Success` with the decoded text; `Failure` if the bytes are not
valid UTF-8, or if this store no longer holds the original bytes to judge.
