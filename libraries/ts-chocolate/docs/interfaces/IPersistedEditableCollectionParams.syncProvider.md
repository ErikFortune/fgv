[Home](../README.md) > [IPersistedEditableCollectionParams](./IPersistedEditableCollectionParams.md) > syncProvider

## IPersistedEditableCollectionParams.syncProvider property

Optional sync provider for flushing FileTree changes to disk.
When absent, PersistedEditableCollection.save | save() writes to the
FileTree but does not sync to the filesystem.

**Signature:**

```typescript
readonly syncProvider: ISyncProvider;
```
