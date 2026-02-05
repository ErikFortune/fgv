[Home](../README.md) > [JournalLibrary](./JournalLibrary.md) > getJournalsForConfectionVersion

## JournalLibrary.getJournalsForConfectionVersion() method

Gets all confection journal entries for a specific confection version (across all collections)

**Signature:**

```typescript
getJournalsForConfectionVersion(versionId: ConfectionVersionId): readonly AnyConfectionJournalEntry[];
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>versionId</td><td>ConfectionVersionId</td><td>The ConfectionVersionId | confection version ID to search for</td></tr>
</tbody></table>

**Returns:**

readonly [AnyConfectionJournalEntry](../type-aliases/AnyConfectionJournalEntry.md)[]

Array of confection journal entries (empty if none found)
