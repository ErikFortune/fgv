[Home](../../README.md) > [Editing](../README.md) > [IPersistedEditableCollectionParams](./IPersistedEditableCollectionParams.md) > operations

## IPersistedEditableCollectionParams.operations property

Optional custom collection operations delegate.

When provided, the PersistedEditableCollection.addItem | addItem(),
PersistedEditableCollection.upsertItem | upsertItem(), and
PersistedEditableCollection.removeItem | removeItem() methods
delegate to these operations instead of the default from
`SubLibraryBase.getCollectionOperations()`.

Use this to inject domain-specific behavior (e.g., branded composite ID
construction, field-based validation) without subclassing.

**Signature:**

```typescript
readonly operations: ICollectionOperations<T, TBaseId>;
```
