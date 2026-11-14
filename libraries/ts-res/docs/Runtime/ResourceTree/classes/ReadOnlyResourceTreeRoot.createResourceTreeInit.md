[Home](../../../README.md) > [Runtime](../../README.md) > [ResourceTree](../README.md) > [ReadOnlyResourceTreeRoot](./ReadOnlyResourceTreeRoot.md) > createResourceTreeInit

## ReadOnlyResourceTreeRoot.createResourceTreeInit() method

Converts an array of resources into tree initialization data.
Validates that resource paths do not conflict - if a path has child resources,
it cannot itself be a resource (e.g., if 'app.messages.welcome' exists, then 'app' cannot be a resource).

**Signature:**

```typescript
static createResourceTreeInit(resources: [ResourceId, T][]): Result<IResourceTreeRootInit<T>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>resources</td><td>[ResourceId, T][]</td><td>Array of [ResourceId, resource] pairs to convert</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IResourceTreeRootInit](../../../interfaces/IResourceTreeRootInit.md)&lt;T&gt;&gt;

Result containing the initialization structure or failure if validation fails
