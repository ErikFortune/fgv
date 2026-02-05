[Home](../../README.md) > [LibraryRuntime](../README.md) > [ConfectionBase](./ConfectionBase.md) > getEffectiveTags

## ConfectionBase.getEffectiveTags() method

Gets effective tags for a specific version (base tags + version's additional tags).

**Signature:**

```typescript
getEffectiveTags(version?: AnyConfectionVersionEntity): readonly string[];
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>version</td><td>AnyConfectionVersionEntity</td><td>The version to get tags for (defaults to golden version)</td></tr>
</tbody></table>

**Returns:**

readonly string[]
