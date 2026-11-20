[Home](../../README.md) > [ResourceTree](../README.md) > [ReadOnlyResourceTreeRoot](./ReadOnlyResourceTreeRoot.md) > create

## ReadOnlyResourceTreeRoot.create() method

Creates a new ReadOnlyResourceTreeRoot from an array of resources.

**Signature:**

```typescript
static create(resources: [ResourceId, T][]): Result<ReadOnlyResourceTreeRoot<T>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>resources</td><td>[ResourceId, T][]</td><td>Array of [ResourceId, resource] pairs to build the tree from</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ReadOnlyResourceTreeRoot](../../classes/ReadOnlyResourceTreeRoot.md)&lt;T&gt;&gt;

Result containing the new root or failure if construction fails
