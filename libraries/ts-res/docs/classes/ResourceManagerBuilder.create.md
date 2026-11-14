[Home](../README.md) > [ResourceManagerBuilder](./ResourceManagerBuilder.md) > create

## ResourceManagerBuilder.create() method

Creates a new Resources.ResourceManagerBuilder | ResourceManagerBuilder object.

**Signature:**

```typescript
static create(params: IResourceManagerBuilderCreateParams): Result<ResourceManagerBuilder>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IResourceManagerBuilderCreateParams</td><td>Parameters to create a new Resources.ResourceManagerBuilder | ResourceManagerBuilder.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ResourceManagerBuilder](ResourceManagerBuilder.md)&gt;

`Success` with the new Resources.ResourceManagerBuilder | ResourceManagerBuilder object if successful,
or `Failure` with an error message if not.
