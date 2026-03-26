[Home](../README.md) > [BundleNormalizer](./BundleNormalizer.md) > normalizeFromPredefined

## BundleNormalizer.normalizeFromPredefined() method

Creates a normalized ResourceManagerBuilder using a predefined system configuration.
This is a convenience method for the common case of using predefined configurations.

**Signature:**

```typescript
static normalizeFromPredefined(originalBuilder: ResourceManagerBuilder, configName: PredefinedSystemConfiguration): Result<ResourceManagerBuilder>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>originalBuilder</td><td>ResourceManagerBuilder</td><td>The ResourceManagerBuilder to normalize</td></tr>
<tr><td>configName</td><td>PredefinedSystemConfiguration</td><td>The name of the predefined system configuration used</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ResourceManagerBuilder](ResourceManagerBuilder.md)&gt;

Success with the normalized ResourceManagerBuilder if successful, Failure otherwise
