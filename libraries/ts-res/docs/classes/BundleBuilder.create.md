[Home](../README.md) > [BundleBuilder](./BundleBuilder.md) > create

## BundleBuilder.create() method

Creates a resource bundle from a ResourceManagerBuilder.

**Signature:**

```typescript
static create(builder: ResourceManagerBuilder, systemConfig: SystemConfiguration, params?: IBundleCreateParams): Result<IBundle>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>builder</td><td>ResourceManagerBuilder</td><td>The ResourceManagerBuilder containing the resources to bundle</td></tr>
<tr><td>systemConfig</td><td>SystemConfiguration</td><td>The SystemConfiguration used to create the builder</td></tr>
<tr><td>params</td><td>IBundleCreateParams</td><td>Optional parameters for bundle creation</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IBundle](../interfaces/IBundle.md)&gt;

Success with the created bundle if successful, Failure with error message otherwise
