[Home](../../README.md) > [Entities](../README.md) > [JournalLibrary](./JournalLibrary.md) > getJournal

## JournalLibrary.getJournal() method

Gets a journal entry by ID (searches all collections)

**Signature:**

```typescript
getJournal(journalId: JournalId): Result<AnyRecipeJournalEntryEntity>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>journalId</td><td>JournalId</td><td>The journal ID to look up</td></tr>
</tbody></table>

**Returns:**

Result&lt;[AnyRecipeJournalEntryEntity](../../type-aliases/AnyRecipeJournalEntryEntity.md)&gt;

Success with the journal entry, or Failure if not found
