[Home](../README.md) > [ISubLibraryParams](./ISubLibraryParams.md) > protectedCollections

## ISubLibraryParams.protectedCollections property

Protected collections that were captured during loading.

These are encrypted collections that could not be decrypted (e.g., due to missing keys).
They can be decrypted later using `loadProtectedCollectionAsync`.

This field is typically populated by `loadAllCollectionsAsync` and passed to
the constructor by derived class `createAsync()` methods.

**Signature:**

```typescript
readonly protectedCollections: readonly IProtectedCollectionInternal<CollectionId>[];
```
