[Home](../../README.md) > [Runtime](../README.md) > [ResourceTreeChildrenValidator](./ResourceTreeChildrenValidator.md) > getBranchById

## ResourceTreeChildrenValidator.getBranchById() method

Gets a branch node by its string ResourceId path, validating the input.

**Signature:**

```typescript
getBranchById(id: string): Result<IReadOnlyResourceTreeBranch<T>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>id</td><td>string</td><td>The string ResourceId path to validate and look up</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IReadOnlyResourceTreeBranch](../../interfaces/IReadOnlyResourceTreeBranch.md)&lt;T&gt;&gt;

Result containing the branch if found and has children, or failure otherwise
