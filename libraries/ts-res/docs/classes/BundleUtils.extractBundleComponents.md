[Home](../README.md) > [BundleUtils](./BundleUtils.md) > extractBundleComponents

## BundleUtils.extractBundleComponents() method

Extracts and validates components from a bundle for reuse.
Performs full validation of the bundle structure and creates typed components.

**Signature:**

```typescript
static extractBundleComponents(bundleData: unknown): Result<IBundleComponents>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>bundleData</td><td>unknown</td><td>The raw bundle data to extract components from</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IBundleComponents](../interfaces/IBundleComponents.md)&gt;

Success with bundle components if valid, Failure with error message otherwise
