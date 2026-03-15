[Home](../../README.md) > [LibraryRuntime](../README.md) > [ChocolateEntityLibrary](./ChocolateEntityLibrary.md) > getPersistedProceduresCollection

## ChocolateEntityLibrary.getPersistedProceduresCollection() method

Get or create a singleton persisted procedures collection.

**Signature:**

```typescript
getPersistedProceduresCollection(collectionId: CollectionId): Result<PersistedEditableCollection<IProcedureEntity, BaseProcedureId>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>ID of the collection</td></tr>
</tbody></table>

**Returns:**

Result&lt;[PersistedEditableCollection](../../classes/PersistedEditableCollection.md)&lt;[IProcedureEntity](../../interfaces/IProcedureEntity.md), [BaseProcedureId](../../type-aliases/BaseProcedureId.md)&gt;&gt;

`Success` with persisted wrapper, or `Failure` if collection not found
