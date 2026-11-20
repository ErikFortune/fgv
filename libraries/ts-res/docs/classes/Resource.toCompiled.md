[Home](../README.md) > [Resource](./Resource.md) > toCompiled

## Resource.toCompiled() method

Converts this resource to a compiled resource representation.

**Signature:**

```typescript
toCompiled(options?: IResourceDeclarationOptions | ICompiledResourceOptionsWithFilter): ICompiledResource;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>options</td><td>IResourceDeclarationOptions | ICompiledResourceOptionsWithFilter</td><td>Optional compilation options controlling the output format and filtering.</td></tr>
</tbody></table>

**Returns:**

[ICompiledResource](../interfaces/ICompiledResource.md)

A compiled resource object that can be used for serialization or runtime processing.
