[Home](../../README.md) > [UserRuntime](../README.md) > [UserLibrary](./UserLibrary.md) > journals

## UserLibrary.journals property

A materialized library of all journal entries, keyed by composite ID.
Journal entries are materialized lazily on access and cached.

**Signature:**

```typescript
readonly journals: MaterializedLibrary<JournalId, AnyJournalEntryEntity, AnyJournalEntry, never>;
```
