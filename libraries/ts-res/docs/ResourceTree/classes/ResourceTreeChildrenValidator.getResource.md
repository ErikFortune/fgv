[Home](../../README.md) > [ResourceTree](../README.md) > [ResourceTreeChildrenValidator](./ResourceTreeChildrenValidator.md) > getResource

## ResourceTreeChildrenValidator.getResource() method

Gets a resource node by its string name (single component), validating the input.

**Signature:**

```typescript
getResource(name: string): Result<IReadOnlyResourceTreeNode<T>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>string</td><td>The string ResourceName to validate and look up</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IReadOnlyResourceTreeNode](../../type-aliases/IReadOnlyResourceTreeNode.md)&lt;T&gt;&gt;

Result containing the node if it's a resource, or failure if validation fails or not found
