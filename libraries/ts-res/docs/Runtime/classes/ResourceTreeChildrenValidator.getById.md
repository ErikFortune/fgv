[Home](../../README.md) > [Runtime](../README.md) > [ResourceTreeChildrenValidator](./ResourceTreeChildrenValidator.md) > getById

## ResourceTreeChildrenValidator.getById() method

Gets a tree node by its string ResourceId path, validating the input.

**Signature:**

```typescript
getById(id: string): Result<IReadOnlyResourceTreeNode<T>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>id</td><td>string</td><td>The string ResourceId path to validate and look up</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IReadOnlyResourceTreeNode](../../type-aliases/IReadOnlyResourceTreeNode.md)&lt;T&gt;&gt;

Result containing the node if found, or failure if validation fails or not found
