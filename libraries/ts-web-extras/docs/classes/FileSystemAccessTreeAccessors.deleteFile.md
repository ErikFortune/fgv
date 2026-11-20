[Home](../README.md) > [FileSystemAccessTreeAccessors](./FileSystemAccessTreeAccessors.md) > deleteFile

## FileSystemAccessTreeAccessors.deleteFile() method

Override deleteFile to track pending deletions for syncToDisk.

**Signature:**

```typescript
deleteFile(path: string): Result<boolean>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>path</td><td>string</td><td></td></tr>
</tbody></table>

**Returns:**

Result&lt;boolean&gt;
