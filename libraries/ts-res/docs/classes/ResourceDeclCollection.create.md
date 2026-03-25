[Home](../README.md) > [ResourceDeclCollection](./ResourceDeclCollection.md) > create

## ResourceDeclCollection.create() method

Creates a new ResourceJson.ResourceDeclCollection | ResourceDeclCollection from an
untyped ResourceJson.Json.IResourceCollectionDecl | resource collection declaration.

**Signature:**

```typescript
static create(from: unknown): Result<ResourceDeclCollection>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>from</td><td>unknown</td><td>The JSON object to convert.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ResourceDeclCollection](ResourceDeclCollection.md)&gt;

`Success` with the new collection if the JSON object is valid, otherwise `Failure`.
