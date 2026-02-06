[Home](../../README.md) > [Entities](../README.md) > [SessionLibrary](./SessionLibrary.md) > getSessionsForFillingRecipeVariation

## SessionLibrary.getSessionsForFillingRecipeVariation() method

Gets all filling sessions for a specific filling variation (across all collections)

**Signature:**

```typescript
getSessionsForFillingRecipeVariation(variationId: FillingRecipeVariationId): readonly IFillingSessionEntity[];
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>variationId</td><td>FillingRecipeVariationId</td><td>The FillingRecipeVariationId | filling variation ID to search for</td></tr>
</tbody></table>

**Returns:**

readonly [IFillingSessionEntity](../../interfaces/IFillingSessionEntity.md)[]

Array of filling sessions (empty if none found)
