[Home](../README.md) > [ResourceResolver](./ResourceResolver.md) > create

## ResourceResolver.create() method

Creates a new Runtime.ResourceResolver | ResourceResolver object.

**Signature:**

```typescript
static create(params: IResourceResolverCreateParams): Result<ResourceResolver>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IResourceResolverCreateParams</td><td>Runtime.IResourceResolverCreateParams | Parameters used to create the resolver.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ResourceResolver](ResourceResolver.md)&gt;

`Success` with the new Runtime.ResourceResolver | ResourceResolver object if successful,
or `Failure` with an error message if not.
