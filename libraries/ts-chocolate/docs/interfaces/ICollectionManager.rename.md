[Home](../README.md) > [ICollectionManager](./ICollectionManager.md) > rename

## ICollectionManager.rename property

Rename a mutable collection to a new ID.

Creates a new collection with the new ID containing all items and metadata
from the old collection, then deletes the old collection and its backing file.

Does NOT update cross-entity references — callers must handle that separately.

**Signature:**

```typescript
readonly rename: (oldCollectionId: CollectionId, newCollectionId: CollectionId) => Result<CollectionId>;
```
