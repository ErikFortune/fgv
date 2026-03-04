[Home](../../README.md) > [Editing](../README.md) > [PersistedEditableCollection](./PersistedEditableCollection.md) > canSave

## PersistedEditableCollection.canSave() method

Check whether this collection supports persistence.

Returns `true` if the underlying collection has a mutable FileTree
source item. Returns `false` for built-in (immutable) collections
or if the editable cannot be created.

**Signature:**

```typescript
canSave(): boolean;
```

**Returns:**

boolean
