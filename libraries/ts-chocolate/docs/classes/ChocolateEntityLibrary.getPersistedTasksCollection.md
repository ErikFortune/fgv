[Home](../README.md) > [ChocolateEntityLibrary](./ChocolateEntityLibrary.md) > getPersistedTasksCollection

## ChocolateEntityLibrary.getPersistedTasksCollection() method

Get or create a singleton persisted tasks collection.

**Signature:**

```typescript
getPersistedTasksCollection(collectionId: CollectionId): Result<PersistedEditableCollection<IRawTaskEntity, BaseTaskId>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>ID of the collection</td></tr>
</tbody></table>

**Returns:**

Result&lt;[PersistedEditableCollection](PersistedEditableCollection.md)&lt;[IRawTaskEntity](../interfaces/IRawTaskEntity.md), [BaseTaskId](../type-aliases/BaseTaskId.md)&gt;&gt;

`Success` with persisted wrapper, or `Failure` if collection not found
