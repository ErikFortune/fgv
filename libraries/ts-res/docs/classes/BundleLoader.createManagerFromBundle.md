[Home](../README.md) > [BundleLoader](./BundleLoader.md) > createManagerFromBundle

## BundleLoader.createManagerFromBundle() method

Creates an IResourceManager from a resource bundle.

**Signature:**

```typescript
static createManagerFromBundle(params: IBundleLoaderCreateParams): Result<IResourceManager<IResource>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IBundleLoaderCreateParams</td><td>Parameters for bundle loading including the bundle and options</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IResourceManager](../interfaces/IResourceManager.md)&lt;[IResource](../interfaces/IResource.md)&gt;&gt;

Success with the IResourceManager if successful, Failure with error message otherwise
