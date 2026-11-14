[Home](../README.md) > [ReadOnlyResourceTreeChildren](./ReadOnlyResourceTreeChildren.md) > getById

## ReadOnlyResourceTreeChildren.getById() method

Gets a tree node by its full ResourceId path.

**Signature:**

```typescript
getById(id: ResourceId): Result<IReadOnlyResourceTreeNode<T>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>id</td><td>ResourceId</td><td>The ResourceId path to look up</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IReadOnlyResourceTreeNode](../type-aliases/IReadOnlyResourceTreeNode.md)&lt;T&gt;&gt;

Result containing the node if found, or failure if not found
