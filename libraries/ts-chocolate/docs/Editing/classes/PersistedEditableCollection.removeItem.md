[Home](../../README.md) > [Editing](../README.md) > [PersistedEditableCollection](./PersistedEditableCollection.md) > removeItem

## PersistedEditableCollection.removeItem() method

Remove an entity and persist.

Delegates to the ICollectionOperations.remove | operations delegate to
perform the domain-aware mutation on the SubLibrary, then runs the full
PersistedEditableCollection.save | save() pipeline.

**Signature:**

```typescript
removeItem(baseId: TBaseId): Promise<Result<T>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>baseId</td><td>TBaseId</td><td>Base entity ID to remove</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;T&gt;&gt;

Success with the removed entity, or Failure
