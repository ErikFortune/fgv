[Home](../README.md) > [EditingSession](./EditingSession.md) > toEditJournalEntry

## EditingSession.toEditJournalEntry() method

Creates an edit journal entry from this session.
Records the original version and any modifications made.

**Signature:**

```typescript
toEditJournalEntry(notes?: ICategorizedNote[]): Result<IFillingEditJournalEntryEntity>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>notes</td><td>ICategorizedNote[]</td><td>Optional notes to include in the journal entry</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IFillingEditJournalEntryEntity](../interfaces/IFillingEditJournalEntryEntity.md)&gt;

Result with journal entry
