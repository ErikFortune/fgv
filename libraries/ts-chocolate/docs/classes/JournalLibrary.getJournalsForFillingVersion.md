[Home](../README.md) > [JournalLibrary](./JournalLibrary.md) > getJournalsForFillingVersion

## JournalLibrary.getJournalsForFillingVersion() method

Gets all filling journal entries for a specific filling version (across all collections)

**Signature:**

```typescript
getJournalsForFillingVersion(versionId: FillingVersionId): readonly AnyFillingJournalEntry[];
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>versionId</td><td>FillingVersionId</td><td>The FillingVersionId | filling version ID to search for</td></tr>
</tbody></table>

**Returns:**

readonly [AnyFillingJournalEntry](../type-aliases/AnyFillingJournalEntry.md)[]

Array of filling journal entries (empty if none found)
