[Home](../../README.md) > [Editing](../README.md) > [ICollectionManager](./ICollectionManager.md) > moveEntity

## ICollectionManager.moveEntity property

Move an entity to another collection (copy + delete).
Does NOT update cross-entity references — callers must handle that separately.

**Signature:**

```typescript
readonly moveEntity: (compositeId: string, targetCollectionId: CollectionId, newBaseId?: string) => Result<string>;
```
