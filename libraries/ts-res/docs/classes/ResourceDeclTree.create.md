[Home](../README.md) > [ResourceDeclTree](./ResourceDeclTree.md) > create

## ResourceDeclTree.create() method

Creates a new ResourceJson.ResourceDeclTree | ResourceDeclTree from an
untyped ResourceJson.Json.IResourceTreeRootDecl | resource tree root declaration.

**Signature:**

```typescript
static create(from: unknown): Result<ResourceDeclTree>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>from</td><td>unknown</td><td>The JSON object to convert.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ResourceDeclTree](ResourceDeclTree.md)&gt;

`Success` with the new tree if the JSON object is valid, otherwise `Failure`.
