[Home](../README.md) > [ISaveResult](./ISaveResult.md) > journalEntry

## ISaveResult.journalEntry property

The full journal entry if one was created.
Callers can use this to persist the journal via `context.journals.addJournal(entry)`.

**Signature:**

```typescript
readonly journalEntry: IFillingEditJournalEntryEntity | IConfectionEditJournalEntryEntity;
```
