[Home](../README.md) > [BundleBuilder](./BundleBuilder.md) > createFromPredefined

## BundleBuilder.createFromPredefined() method

Creates a resource bundle from a ResourceManagerBuilder using a predefined system configuration.
This is a convenience method for the common case of using predefined configurations.

**Signature:**

```typescript
static createFromPredefined(builder: ResourceManagerBuilder, configName: PredefinedSystemConfiguration, params?: IBundleCreateParams): Result<IBundle>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>builder</td><td>ResourceManagerBuilder</td><td>The ResourceManagerBuilder containing the resources to bundle</td></tr>
<tr><td>configName</td><td>PredefinedSystemConfiguration</td><td>The name of the predefined system configuration used</td></tr>
<tr><td>params</td><td>IBundleCreateParams</td><td>Optional parameters for bundle creation</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IBundle](../interfaces/IBundle.md)&gt;

Success with the created bundle if successful, Failure with error message otherwise
