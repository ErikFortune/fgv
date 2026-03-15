[Home](../../README.md) > [Editing](../README.md) > [IPersistedEditableCollectionParams](./IPersistedEditableCollectionParams.md) > onMutation

## IPersistedEditableCollectionParams.onMutation property

Optional callback invoked after a successful entity mutation
(PersistedEditableCollection.addItem | addItem,
PersistedEditableCollection.upsertItem | upsertItem,
PersistedEditableCollection.removeItem | removeItem).

Called after the in-memory mutation succeeds, regardless of whether
the subsequent persist step succeeds. Use this to invalidate
materialized caches that wrap the same SubLibrary.

**Signature:**

```typescript
readonly onMutation: (compositeId: string) => void;
```
