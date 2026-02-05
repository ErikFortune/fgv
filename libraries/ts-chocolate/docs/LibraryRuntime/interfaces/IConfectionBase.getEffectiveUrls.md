[Home](../../README.md) > [LibraryRuntime](../README.md) > [IConfectionBase](./IConfectionBase.md) > getEffectiveUrls

## IConfectionBase.getEffectiveUrls() method

Gets effective URLs for a specific version.

**Signature:**

```typescript
getEffectiveUrls(version?: AnyConfectionVersionEntity): readonly ICategorizedUrl[];
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>version</td><td>AnyConfectionVersionEntity</td><td>The version to get URLs for (defaults to golden version)</td></tr>
</tbody></table>

**Returns:**

readonly [ICategorizedUrl](../../interfaces/ICategorizedUrl.md)[]
