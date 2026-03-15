[Home](../README.md) > [PersistedEditableCollection](./PersistedEditableCollection.md) > save

## PersistedEditableCollection.save() method

Persist the collection's current in-memory state to disk.

Pipeline:
1. Invalidate cached snapshot (force re-read from SubLibrary)
2. Create fresh EditableCollection from SubLibrary
3. Serialize and write to FileTree via `editable.save()`
4. If a sync provider is configured, flush FileTree to filesystem

**Signature:**

```typescript
save(): Promise<Result<true>>;
```

**Returns:**

Promise&lt;Result&lt;true&gt;&gt;

`Success<true>` if the full pipeline succeeded, `Failure` with
  error context otherwise. Returns failure if the collection is immutable,
  has no FileTree source, or if any step in the pipeline fails.
