[Home](../README.md) > [ICollectionManager](./ICollectionManager.md) > merge

## ICollectionManager.merge property

Merge all items from a source collection into a target collection.

Moves items from source to target, applying the specified conflict strategy
when both collections contain an item with the same base ID. After merging,
the source collection is deleted.

Does NOT update cross-entity references — callers must handle that separately.

**Signature:**

```typescript
readonly merge: (sourceCollectionId: CollectionId, targetCollectionId: CollectionId, onConflict: MergeConflictStrategy) => Result<IMergeResult>;
```
