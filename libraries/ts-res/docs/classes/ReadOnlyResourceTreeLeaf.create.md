[Home](../README.md) > [ReadOnlyResourceTreeLeaf](./ReadOnlyResourceTreeLeaf.md) > create

## ReadOnlyResourceTreeLeaf.create() method

Creates a new ReadOnlyResourceTreeLeaf instance.

**Signature:**

```typescript
static create(name: ResourceName, parentPath: ResourceId | undefined, resource: T): Result<ReadOnlyResourceTreeLeaf<T>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>ResourceName</td><td>The name of this node (last segment of the path)</td></tr>
<tr><td>parentPath</td><td>ResourceId | undefined</td><td>The path to the parent node (undefined for root-level nodes)</td></tr>
<tr><td>resource</td><td>T</td><td>The resource value to store in this leaf</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ReadOnlyResourceTreeLeaf](ReadOnlyResourceTreeLeaf.md)&lt;T&gt;&gt;

Result containing the new leaf node or failure if construction fails
