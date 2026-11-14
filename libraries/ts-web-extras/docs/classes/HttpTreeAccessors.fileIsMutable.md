[Home](../README.md) > [HttpTreeAccessors](./HttpTreeAccessors.md) > fileIsMutable

## HttpTreeAccessors.fileIsMutable() method

Checks if a file is mutable (can be modified).

**Signature:**

```typescript
fileIsMutable(path: string): DetailedResult<boolean, SaveDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>path</td><td>string</td><td>The path to the file.</td></tr>
</tbody></table>

**Returns:**

DetailedResult&lt;boolean, SaveDetail&gt;

A detailed result indicating if the file is mutable and the reason.
