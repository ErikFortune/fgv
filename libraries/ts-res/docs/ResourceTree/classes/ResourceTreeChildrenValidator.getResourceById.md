[Home](../../README.md) > [ResourceTree](../README.md) > [ResourceTreeChildrenValidator](./ResourceTreeChildrenValidator.md) > getResourceById

## ResourceTreeChildrenValidator.getResourceById() method

Gets a resource leaf node by its string ResourceId path, validating the input.

**Signature:**

```typescript
getResourceById(id: string): Result<IReadOnlyResourceTreeLeaf<T>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>id</td><td>string</td><td>The string ResourceId path to validate and look up</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IReadOnlyResourceTreeLeaf](../../interfaces/IReadOnlyResourceTreeLeaf.md)&lt;T&gt;&gt;

Result containing the leaf if found and is a resource, or failure otherwise
