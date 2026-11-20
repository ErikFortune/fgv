[Home](../../README.md) > [ResourceTree](../README.md) > [ReadOnlyResourceTreeBranch](./ReadOnlyResourceTreeBranch.md) > create

## ReadOnlyResourceTreeBranch.create() method

Creates a new ReadOnlyResourceTreeBranch instance.

**Signature:**

```typescript
static create(childName: ResourceName, path: ResourceId | undefined, childInit: IResourceTreeBranchInit<T>): Result<ReadOnlyResourceTreeBranch<T>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>childName</td><td>ResourceName</td><td>The name of this node (last segment of the path)</td></tr>
<tr><td>path</td><td>ResourceId | undefined</td><td>The path to the parent node (undefined for root-level nodes)</td></tr>
<tr><td>childInit</td><td>IResourceTreeBranchInit&lt;T&gt;</td><td>Initialization data containing child nodes</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ReadOnlyResourceTreeBranch](../../classes/ReadOnlyResourceTreeBranch.md)&lt;T&gt;&gt;

Result containing the new branch node or failure if construction fails
