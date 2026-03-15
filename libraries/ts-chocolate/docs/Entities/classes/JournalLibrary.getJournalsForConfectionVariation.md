[Home](../../README.md) > [Entities](../README.md) > [JournalLibrary](./JournalLibrary.md) > getJournalsForConfectionVariation

## JournalLibrary.getJournalsForConfectionVariation() method

Gets all confection journal entries for a specific confection variations (across all collections)

**Signature:**

```typescript
getJournalsForConfectionVariation(variationId: ConfectionRecipeVariationId): readonly AnyConfectionJournalEntry[];
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>variationId</td><td>ConfectionRecipeVariationId</td><td>The ConfectionRecipeVariationId | confection variation ID to search for</td></tr>
</tbody></table>

**Returns:**

readonly [AnyConfectionJournalEntry](../../type-aliases/AnyConfectionJournalEntry.md)[]

Array of confection journal entries (empty if none found)
