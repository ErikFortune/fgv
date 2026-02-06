[Home](../README.md) > [ChocolateEntityLibrary](./ChocolateEntityLibrary.md) > getEditableProceduresEntityCollection

## ChocolateEntityLibrary.getEditableProceduresEntityCollection() method

Get an editable procedures collection with persistence enabled.

**Signature:**

```typescript
getEditableProceduresEntityCollection(collectionId: CollectionId): Result<EditableCollection<IProcedureEntity, BaseProcedureId>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>ID of the collection to make editable</td></tr>
</tbody></table>

**Returns:**

Result&lt;[EditableCollection](EditableCollection.md)&lt;[IProcedureEntity](../interfaces/IProcedureEntity.md), [BaseProcedureId](../type-aliases/BaseProcedureId.md)&gt;&gt;

Result containing EditableCollection with persistence, or Failure
