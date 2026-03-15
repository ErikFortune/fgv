[Home](../../README.md) > [LibraryRuntime](../README.md) > [ConfectionBase](./ConfectionBase.md) > getEffectiveUrls

## ConfectionBase.getEffectiveUrls() method

Gets effective URLs for a specific variation (base URLs + variation's additional URLs).

**Signature:**

```typescript
getEffectiveUrls(variation?: AnyConfectionRecipeVariationEntity): readonly ICategorizedUrl[];
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>variation</td><td>AnyConfectionRecipeVariationEntity</td><td>The variation to get URLs for (defaults to golden variation)</td></tr>
</tbody></table>

**Returns:**

readonly [ICategorizedUrl](../../interfaces/ICategorizedUrl.md)[]
