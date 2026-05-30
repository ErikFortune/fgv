[Home](../README.md) > [BundleUtils](./BundleUtils.md) > isBundleFileName

## BundleUtils.isBundleFileName() method

Checks if a file name suggests it might be a bundle file.
This is a heuristic check based on file naming conventions.

**Signature:**

```typescript
static isBundleFileName(fileName: string): boolean;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>fileName</td><td>string</td><td>The file name to check</td></tr>
</tbody></table>

**Returns:**

boolean

True if the file name suggests a bundle file
