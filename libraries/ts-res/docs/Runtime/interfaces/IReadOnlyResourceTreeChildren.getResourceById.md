[Home](../../README.md) > [Runtime](../README.md) > [IReadOnlyResourceTreeChildren](./IReadOnlyResourceTreeChildren.md) > getResourceById

## IReadOnlyResourceTreeChildren.getResourceById() method

Gets a resource leaf node by its full ResourceId path.

**Signature:**

```typescript
getResourceById(id: TID): Result<IReadOnlyResourceTreeLeaf<T>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>id</td><td>TID</td><td>The ResourceId path to look up</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IReadOnlyResourceTreeLeaf](../../interfaces/IReadOnlyResourceTreeLeaf.md)&lt;T&gt;&gt;

Result containing the leaf if found and is a resource, or failure otherwise
