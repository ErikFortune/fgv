[Home](../../README.md) > [Bundle](../README.md) > [BundleUtils](./BundleUtils.md) > parseBundleFromJson

## BundleUtils.parseBundleFromJson() method

Parses bundle data from a JSON string.
Convenience method that combines JSON parsing with bundle component extraction.

**Signature:**

```typescript
static parseBundleFromJson(jsonString: string): Result<IBundleComponents>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>jsonString</td><td>string</td><td>The JSON string containing bundle data</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IBundleComponents](../../interfaces/IBundleComponents.md)&gt;

Success with bundle components if valid, Failure with error message otherwise
