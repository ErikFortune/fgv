[Home](../../README.md) > [Entities](../README.md) > [JournalLibrary](./JournalLibrary.md) > addJournal

## JournalLibrary.addJournal() method

Adds a journal entry to a collection.

**Signature:**

```typescript
addJournal(collectionId: CollectionId, entry: AnyRecipeJournalEntryEntity): Result<JournalId>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>Target collection for the entry</td></tr>
<tr><td>entry</td><td>AnyRecipeJournalEntryEntity</td><td>The journal entry entity to add</td></tr>
</tbody></table>

**Returns:**

Result&lt;[JournalId](../../type-aliases/JournalId.md)&gt;

Success with composite JournalId, or Failure if the add fails
