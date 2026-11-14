[Home](../README.md) > [BundleUtils](./BundleUtils.md) > isBundleFile

## BundleUtils.isBundleFile() method

Checks if the given object appears to be a bundle file by examining its structure.
This is a lightweight check that doesn't perform full validation.

**Signature:**

```typescript
static isBundleFile(data: unknown): boolean;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>data</td><td>unknown</td><td>The data to check</td></tr>
</tbody></table>

**Returns:**

boolean

True if the data appears to be a bundle structure
