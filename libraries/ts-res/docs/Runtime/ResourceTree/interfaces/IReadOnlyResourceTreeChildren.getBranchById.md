[Home](../../../README.md) > [Runtime](../../README.md) > [ResourceTree](../README.md) > [IReadOnlyResourceTreeChildren](./IReadOnlyResourceTreeChildren.md) > getBranchById

## IReadOnlyResourceTreeChildren.getBranchById() method

Gets a branch node by its full ResourceId path.

**Signature:**

```typescript
getBranchById(id: TID): Result<IReadOnlyResourceTreeBranch<T>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>id</td><td>TID</td><td>The ResourceId path to look up</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IReadOnlyResourceTreeBranch](../../../interfaces/IReadOnlyResourceTreeBranch.md)&lt;T&gt;&gt;

Result containing the branch if found and has children, or failure otherwise
