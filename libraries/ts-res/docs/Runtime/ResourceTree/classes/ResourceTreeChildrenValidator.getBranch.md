[Home](../../../README.md) > [Runtime](../../README.md) > [ResourceTree](../README.md) > [ResourceTreeChildrenValidator](./ResourceTreeChildrenValidator.md) > getBranch

## ResourceTreeChildrenValidator.getBranch() method

Gets a branch node by its string name (single component), validating the input.

**Signature:**

```typescript
getBranch(name: string): Result<IReadOnlyResourceTreeNode<T>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>string</td><td>The string ResourceName to validate and look up</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IReadOnlyResourceTreeNode](../../../type-aliases/IReadOnlyResourceTreeNode.md)&lt;T&gt;&gt;

Result containing the node if it's a branch, or failure if validation fails or not found
