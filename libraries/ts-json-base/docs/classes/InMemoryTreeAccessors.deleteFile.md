[Home](../README.md) > [InMemoryTreeAccessors](./InMemoryTreeAccessors.md) > deleteFile

## InMemoryTreeAccessors.deleteFile() method

Deletes a file at the given path.

**Signature:**

```typescript
deleteFile(path: string): Result<boolean>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>path</td><td>string</td><td>The path of the file to delete.</td></tr>
</tbody></table>

**Returns:**

Result&lt;boolean&gt;

`Success` with `true` if the file was deleted, or `Failure` with an error message.
