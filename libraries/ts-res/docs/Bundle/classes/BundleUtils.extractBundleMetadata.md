[Home](../../README.md) > [Bundle](../README.md) > [BundleUtils](./BundleUtils.md) > extractBundleMetadata

## BundleUtils.extractBundleMetadata() method

Extracts just the metadata from potential bundle data without full validation.
Useful for displaying bundle information without processing the entire bundle.

**Signature:**

```typescript
static extractBundleMetadata(data: unknown): Result<IBundleMetadata>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>data</td><td>unknown</td><td>The data to extract metadata from</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IBundleMetadata](../../interfaces/IBundleMetadata.md)&gt;

Success with metadata if found and valid, Failure otherwise
