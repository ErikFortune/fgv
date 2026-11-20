[Home](../README.md) > [BundleNormalizer](./BundleNormalizer.md) > normalize

## BundleNormalizer.normalize() method

Creates a normalized ResourceManagerBuilder from an existing builder.
The normalized builder will have identical entities but arranged in
canonical order to ensure consistent index assignments.

**Signature:**

```typescript
static normalize(originalBuilder: ResourceManagerBuilder, systemConfig: SystemConfiguration): Result<ResourceManagerBuilder>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>originalBuilder</td><td>ResourceManagerBuilder</td><td>The ResourceManagerBuilder to normalize</td></tr>
<tr><td>systemConfig</td><td>SystemConfiguration</td><td>The SystemConfiguration used to create the original builder</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ResourceManagerBuilder](ResourceManagerBuilder.md)&gt;

Success with the normalized ResourceManagerBuilder if successful, Failure otherwise
