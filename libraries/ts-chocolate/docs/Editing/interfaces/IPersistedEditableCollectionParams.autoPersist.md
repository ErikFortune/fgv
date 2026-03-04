[Home](../../README.md) > [Editing](../README.md) > [IPersistedEditableCollectionParams](./IPersistedEditableCollectionParams.md) > autoPersist

## IPersistedEditableCollectionParams.autoPersist property

When `true`, mutation methods (PersistedEditableCollection.set | set(),
PersistedEditableCollection.delete | delete()) automatically trigger
PersistedEditableCollection.save | save() after each mutation.

**Signature:**

```typescript
readonly autoPersist: boolean;
```
