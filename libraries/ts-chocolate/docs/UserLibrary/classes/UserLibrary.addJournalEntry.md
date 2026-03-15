[Home](../../README.md) > [UserLibrary](../README.md) > [UserLibrary](./UserLibrary.md) > addJournalEntry

## UserLibrary.addJournalEntry() method

Adds a journal entry to a collection and persists via PEC.

**Signature:**

```typescript
addJournalEntry(collectionId: CollectionId, entry: AnyRecipeJournalEntryEntity): Promise<Result<JournalId>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>Target journal collection</td></tr>
<tr><td>entry</td><td>AnyRecipeJournalEntryEntity</td><td>Journal entry entity to add</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[JournalId](../../type-aliases/JournalId.md)&gt;&gt;

Promise with Result containing the composite JournalId
