[Home](../README.md) > [LocalStorageTreeAccessors](./LocalStorageTreeAccessors.md) > saveFileContents

## LocalStorageTreeAccessors.saveFileContents() method

Save file contents. Marks file as dirty and optionally auto-syncs.

**Signature:**

```typescript
saveFileContents(path: string, contents: string): Result<string>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>path</td><td>string</td><td>File path</td></tr>
<tr><td>contents</td><td>string</td><td>New file contents</td></tr>
</tbody></table>

**Returns:**

Result&lt;string&gt;

Result with the saved contents or error
