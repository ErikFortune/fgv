[Home](../README.md) > [SessionLibrary](./SessionLibrary.md) > getSessionsForConfectionRecipeVariation

## SessionLibrary.getSessionsForConfectionRecipeVariation() method

Gets all confection sessions for a specific confection variation (across all collections)

**Signature:**

```typescript
getSessionsForConfectionRecipeVariation(variationId: ConfectionRecipeVariationId): readonly IConfectionSessionEntity[];
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>variationId</td><td>ConfectionRecipeVariationId</td><td>The ConfectionRecipeVariationId | confection variation ID to search for</td></tr>
</tbody></table>

**Returns:**

readonly [IConfectionSessionEntity](../interfaces/IConfectionSessionEntity.md)[]

Array of confection sessions (empty if none found)
