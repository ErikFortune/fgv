[Home](../README.md) > [ReadOnlyResourceTreeChildren](./ReadOnlyResourceTreeChildren.md) > getBranch

## ReadOnlyResourceTreeChildren.getBranch() method

Gets a branch node by its direct name (single component).

**Signature:**

```typescript
getBranch(name: ResourceName): Result<IReadOnlyResourceTreeNode<T>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>ResourceName</td><td>The ResourceName to look up</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IReadOnlyResourceTreeNode](../type-aliases/IReadOnlyResourceTreeNode.md)&lt;T&gt;&gt;

Result containing the node if it's a branch, or failure if not found or not a branch
