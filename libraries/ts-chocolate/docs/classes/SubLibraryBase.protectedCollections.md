[Home](../README.md) > [SubLibraryBase](./SubLibraryBase.md) > protectedCollections

## SubLibraryBase.protectedCollections property

Gets the list of protected collections that were captured but not decrypted.

These are encrypted collections that were encountered during loading but couldn't
be decrypted (e.g., due to missing encryption keys). They can be decrypted later
using LibraryData.SubLibraryBase.loadProtectedCollectionAsync | loadProtectedCollectionAsync.

**Signature:**

```typescript
readonly protectedCollections: readonly IProtectedCollectionInfo<CollectionId>[];
```
