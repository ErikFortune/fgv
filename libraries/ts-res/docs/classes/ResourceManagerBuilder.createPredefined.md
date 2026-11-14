[Home](../README.md) > [ResourceManagerBuilder](./ResourceManagerBuilder.md) > createPredefined

## ResourceManagerBuilder.createPredefined() method

Creates a new Resources.ResourceManagerBuilder | ResourceManagerBuilder object from a predefined system configuration.

**Signature:**

```typescript
static createPredefined(name: PredefinedSystemConfiguration, qualifierDefaultValues?: Record<string, string | null>): Result<ResourceManagerBuilder>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>PredefinedSystemConfiguration</td><td>The name of the predefined system configuration to use.</td></tr>
<tr><td>qualifierDefaultValues</td><td>Record&lt;string, string | null&gt;</td><td>Optional default values for qualifiers.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ResourceManagerBuilder](ResourceManagerBuilder.md)&gt;

`Success` with the new Resources.ResourceManagerBuilder | ResourceManagerBuilder object if successful,
or `Failure` with an error message if not.
