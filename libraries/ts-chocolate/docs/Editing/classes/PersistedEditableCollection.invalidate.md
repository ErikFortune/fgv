[Home](../../README.md) > [Editing](../README.md) > [PersistedEditableCollection](./PersistedEditableCollection.md) > invalidate

## PersistedEditableCollection.invalidate() method

Clear the cached EditableCollection, forcing a fresh snapshot
from the SubLibrary on the next access.

Call this after external mutations to the SubLibrary (e.g., via
CollectionManager) to ensure the next `save()` reflects
the current state.

**Signature:**

```typescript
invalidate(): void;
```

**Returns:**

void
