[Home](../../README.md) > [Entities](../README.md) > [JournalLibrary](./JournalLibrary.md) > getJournalsForConfection

## JournalLibrary.getJournalsForConfection() method

Gets all confection journal entries for a confection (across all versions and collections)

**Signature:**

```typescript
getJournalsForConfection(confectionId: ConfectionId): readonly AnyConfectionJournalEntry[];
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>confectionId</td><td>ConfectionId</td><td>The ConfectionId | confection ID to search for</td></tr>
</tbody></table>

**Returns:**

readonly [AnyConfectionJournalEntry](../../type-aliases/AnyConfectionJournalEntry.md)[]

Array of confection journal entries (empty if none found)
