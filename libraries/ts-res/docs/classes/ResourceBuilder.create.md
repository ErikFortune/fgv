[Home](../README.md) > [ResourceBuilder](./ResourceBuilder.md) > create

## ResourceBuilder.create() method

Creates a new Resources.ResourceBuilder | ResourceBuilder object.

**Signature:**

```typescript
static create(params: IResourceBuilderCreateParams): Result<ResourceBuilder>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IResourceBuilderCreateParams</td><td>Parameters to create a new Resources.ResourceBuilder | ResourceBuilder.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ResourceBuilder](ResourceBuilder.md)&gt;

`Success` with the new Resources.ResourceBuilder | ResourceBuilder object if successful,
or `Failure` with an error message if not.
