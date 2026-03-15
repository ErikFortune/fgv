[Home](../../README.md) > [Entities](../README.md) > AnyRecipeJournalEntryEntity

# Type Alias: AnyRecipeJournalEntryEntity

Discriminated union of recipe-based journal entry types.
These entries all extend IJournalEntryEntityBase and have variationId/updatedId fields.

## Type

```typescript
type AnyRecipeJournalEntryEntity = IFillingEditJournalEntryEntity | IConfectionEditJournalEntryEntity | IFillingProductionJournalEntryEntity | IConfectionProductionJournalEntryEntity
```
