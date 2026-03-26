[Home](../../README.md) > [Resources](../README.md) > [DeltaGenerator](./DeltaGenerator.md) > generate

## DeltaGenerator.generate() method

Generates deltas between baseline and delta resolvers.
Creates a cloned resource manager with partial/augment candidates for updates
and full/replace candidates for new resources.

**Signature:**

```typescript
generate(options?: IDeltaGeneratorOptions): Result<ResourceManagerBuilder>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>options</td><td>IDeltaGeneratorOptions</td><td>Options controlling delta generation behavior.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ResourceManagerBuilder](../../classes/ResourceManagerBuilder.md)&gt;

`Success` with the updated resource manager if successful,
or `Failure` with an error message if not.
