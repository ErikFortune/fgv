[Home](../README.md) > [LocalStorageTreeAccessors](./LocalStorageTreeAccessors.md) > fileIsMutable

## LocalStorageTreeAccessors.fileIsMutable() method

Check if a file is mutable and return persistence detail.

**Signature:**

```typescript
fileIsMutable(path: string): DetailedResult<boolean, SaveDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>path</td><td>string</td><td>File path to check</td></tr>
</tbody></table>

**Returns:**

DetailedResult&lt;boolean, SaveDetail&gt;

DetailedResult with mutability status and 'persistent' detail if mutable
