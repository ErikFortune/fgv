[Home](../../README.md) > [Entities](../README.md) > [JournalLibrary](./JournalLibrary.md) > getJournalsForFillingVariation

## JournalLibrary.getJournalsForFillingVariation() method

Gets all filling journal entries for a specific filling variation (across all collections)

**Signature:**

```typescript
getJournalsForFillingVariation(variationId: FillingRecipeVariationId): readonly AnyFillingJournalEntry[];
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>variationId</td><td>FillingRecipeVariationId</td><td>The FillingRecipeVariationId | filling recipe variation ID to search for</td></tr>
</tbody></table>

**Returns:**

readonly [AnyFillingJournalEntry](../../type-aliases/AnyFillingJournalEntry.md)[]

Array of filling journal entries (empty if none found)
