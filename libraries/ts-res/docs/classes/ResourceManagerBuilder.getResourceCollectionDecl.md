[Home](../README.md) > [ResourceManagerBuilder](./ResourceManagerBuilder.md) > getResourceCollectionDecl

## ResourceManagerBuilder.getResourceCollectionDecl() method

Gets a resource collection declaration containing all built resources in a flat array structure.
This method returns all built resources as an ResourceJson.Normalized.IResourceCollectionDecl | IResourceCollectionDecl
that can be used for serialization, export, or re-import. Resources are sorted by ID for consistent ordering.

**Signature:**

```typescript
getResourceCollectionDecl(options?: IResourceDeclarationOptions): Result<IResourceCollectionDecl>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>options</td><td>IResourceDeclarationOptions</td><td>Optional Resources.IResourceDeclarationOptions | declaration options controlling the output format.
If `options.normalized` is `true`, applies hash-based normalization for additional consistency guarantees.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IResourceCollectionDecl](../interfaces/IResourceCollectionDecl.md)&gt;

Success with the resource collection declaration if successful, Failure otherwise.
