[Home](../../README.md) > [UserEntities](../README.md) > [IUserEntityPersistenceConfig](./IUserEntityPersistenceConfig.md) > onMutation

## IUserEntityPersistenceConfig.onMutation property

Optional callback invoked after any entity mutation via persisted collections.
Use this to invalidate materialized caches that wrap the same SubLibrary.

**Signature:**

```typescript
readonly onMutation: (subLibraryId: SubLibraryId, compositeId: string) => void;
```
