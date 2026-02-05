[Home](../README.md) > [JournalLibrary](./JournalLibrary.md) > getJournalsForFilling

## JournalLibrary.getJournalsForFilling() method

Gets all filling journal entries for a filling (across all versions and collections)

**Signature:**

```typescript
getJournalsForFilling(fillingId: FillingId): readonly AnyFillingJournalEntry[];
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>fillingId</td><td>FillingId</td><td>The FillingId | filling ID to search for</td></tr>
</tbody></table>

**Returns:**

readonly [AnyFillingJournalEntry](../type-aliases/AnyFillingJournalEntry.md)[]

Array of filling journal entries (empty if none found)
