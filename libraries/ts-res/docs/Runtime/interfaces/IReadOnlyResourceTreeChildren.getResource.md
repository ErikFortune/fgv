[Home](../../README.md) > [Runtime](../README.md) > [IReadOnlyResourceTreeChildren](./IReadOnlyResourceTreeChildren.md) > getResource

## IReadOnlyResourceTreeChildren.getResource() method

Gets a resource node by its direct name (single component).

**Signature:**

```typescript
getResource(name: TNAME): Result<IReadOnlyResourceTreeNode<T>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>TNAME</td><td>The ResourceName to look up</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IReadOnlyResourceTreeNode](../../type-aliases/IReadOnlyResourceTreeNode.md)&lt;T&gt;&gt;

Result containing the node if it's a resource, or failure if not found or not a resource
