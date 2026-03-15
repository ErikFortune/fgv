[Home](../README.md) > [PersistedEditableCollection](./PersistedEditableCollection.md) > getEditable

## PersistedEditableCollection.getEditable() method

Access the underlying EditableCollection, lazily creating it
from the SubLibrary if not yet initialized.

**Signature:**

```typescript
getEditable(): Result<EditableCollection<T, TBaseId>>;
```

**Returns:**

Result&lt;[EditableCollection](EditableCollection.md)&lt;T, TBaseId&gt;&gt;

`Success` with the editable collection, or `Failure` if the
  collection cannot be found or created.
