[Home](../README.md) > [ConfectionBase](./ConfectionBase.md) > getEffectiveTags

## ConfectionBase.getEffectiveTags() method

Gets effective tags for a specific variation (base tags + variation's additional tags).

**Signature:**

```typescript
getEffectiveTags(variation?: AnyConfectionRecipeVariationEntity): readonly string[];
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>variation</td><td>AnyConfectionRecipeVariationEntity</td><td>The variation to get tags for (defaults to golden variation)</td></tr>
</tbody></table>

**Returns:**

readonly string[]
