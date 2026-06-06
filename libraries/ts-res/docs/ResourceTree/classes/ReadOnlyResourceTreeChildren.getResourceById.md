[Home](../../README.md) > [ResourceTree](../README.md) > [ReadOnlyResourceTreeChildren](./ReadOnlyResourceTreeChildren.md) > getResourceById

## ReadOnlyResourceTreeChildren.getResourceById() method

Gets a resource leaf node by its full ResourceId path.

**Signature:**

```typescript
getResourceById(id: ResourceId): Result<IReadOnlyResourceTreeLeaf<T>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>id</td><td>ResourceId</td><td>The ResourceId path to look up</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IReadOnlyResourceTreeLeaf](../../interfaces/IReadOnlyResourceTreeLeaf.md)&lt;T&gt;&gt;

Result containing the leaf if found and is a resource, or failure otherwise
