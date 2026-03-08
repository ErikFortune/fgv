[Home](../../README.md) > [Editing](../README.md) > [PersistedEditableCollection](./PersistedEditableCollection.md) > addItem

## PersistedEditableCollection.addItem() method

Add a new entity and persist.

Delegates to the ICollectionOperations.add | operations delegate to
perform the domain-aware mutation on the SubLibrary, then runs the full
PersistedEditableCollection.save | save() pipeline.

**Signature:**

```typescript
addItem(baseId: TBaseId, entity: T): Promise<Result<string>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>baseId</td><td>TBaseId</td><td>Base entity ID within the collection</td></tr>
<tr><td>entity</td><td>T</td><td>The entity to add</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;string&gt;&gt;

Success with the composite ID string, or Failure
