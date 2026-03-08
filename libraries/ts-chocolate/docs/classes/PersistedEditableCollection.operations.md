[Home](../README.md) > [PersistedEditableCollection](./PersistedEditableCollection.md) > operations

## PersistedEditableCollection.operations property

The collection operations delegate.

Returns the custom operations if provided at construction, otherwise
lazily creates the default from `SubLibraryBase.getCollectionOperations()`.

**Signature:**

```typescript
readonly operations: ICollectionOperations<T, TBaseId>;
```
