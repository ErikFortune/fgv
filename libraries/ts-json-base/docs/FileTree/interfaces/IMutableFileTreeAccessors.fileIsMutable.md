[Home](../../README.md) > [FileTree](../README.md) > [IMutableFileTreeAccessors](./IMutableFileTreeAccessors.md) > fileIsMutable

## IMutableFileTreeAccessors.fileIsMutable() method

Checks if a file at the given path can be saved.

**Signature:**

```typescript
fileIsMutable(path: string): DetailedResult<boolean, SaveDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>path</td><td>string</td><td>The path to check.</td></tr>
</tbody></table>

**Returns:**

DetailedResult&lt;boolean, [SaveDetail](../../type-aliases/SaveDetail.md)&gt;

`DetailedSuccess` with FileTree.SaveCapability if the file can be saved,
or `DetailedFailure` with FileTree.SaveFailureReason if it cannot.
