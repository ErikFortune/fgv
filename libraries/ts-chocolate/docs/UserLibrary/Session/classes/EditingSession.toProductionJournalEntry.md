[Home](../../../README.md) > [UserLibrary](../../README.md) > [Session](../README.md) > [EditingSession](./EditingSession.md) > toProductionJournalEntry

## EditingSession.toProductionJournalEntry() method

Creates a production journal entry from this session.
Records the produced filling with resolved concrete choices.

**Signature:**

```typescript
toProductionJournalEntry(notes?: ICategorizedNote[]): Result<IFillingProductionJournalEntryEntity>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>notes</td><td>ICategorizedNote[]</td><td>Optional notes to include in the journal entry</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IFillingProductionJournalEntryEntity](../../../interfaces/IFillingProductionJournalEntryEntity.md)&gt;

Result with production journal entry
