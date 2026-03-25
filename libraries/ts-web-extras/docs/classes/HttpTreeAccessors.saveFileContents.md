[Home](../README.md) > [HttpTreeAccessors](./HttpTreeAccessors.md) > saveFileContents

## HttpTreeAccessors.saveFileContents() method

Saves file contents and marks the file as dirty for synchronization.

**Signature:**

```typescript
saveFileContents(path: string, contents: string): Result<string>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>path</td><td>string</td><td>The path to the file.</td></tr>
<tr><td>contents</td><td>string</td><td>The new contents of the file.</td></tr>
</tbody></table>

**Returns:**

Result&lt;string&gt;

A result indicating success or failure.
