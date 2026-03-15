[Home](../../README.md) > [UserLibrary](../README.md) > [ConfectionEditingSessionBase](./ConfectionEditingSessionBase.md) > toProductionJournalEntry

## ConfectionEditingSessionBase.toProductionJournalEntry() method

Creates a production journal entry from this confection session.
Records the produced confection with resolved concrete choices,
including embedded filling production snapshots for recipe-type filling slots.

**Signature:**

```typescript
toProductionJournalEntry(notes?: readonly ICategorizedNote[]): Result<IConfectionProductionJournalEntryEntity>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>notes</td><td>readonly ICategorizedNote[]</td><td>Optional notes to include in the journal entry</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IConfectionProductionJournalEntryEntity](../../interfaces/IConfectionProductionJournalEntryEntity.md)&gt;

Result with production journal entry
