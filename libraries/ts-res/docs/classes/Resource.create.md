[Home](../README.md) > [Resource](./Resource.md) > create

## Resource.create() method

Creates a new Resources.Resource | Resource object.

**Signature:**

```typescript
static create(params: IResourceCreateParams): Result<Resource>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IResourceCreateParams</td><td>Resources.IResourceCreateParams | Parameters used to create the resource.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[Resource](Resource.md)&gt;

`Success` with the new Resources.Resource | Resource object if successful,
or `Failure` with an error message if not.
