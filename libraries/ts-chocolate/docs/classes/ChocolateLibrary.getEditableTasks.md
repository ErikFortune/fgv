[Home](../README.md) > [ChocolateLibrary](./ChocolateLibrary.md) > getEditableTasks

## ChocolateLibrary.getEditableTasks() method

Get an editable tasks collection with persistence enabled.

**Signature:**

```typescript
getEditableTasks(collectionId: CollectionId): Result<EditableCollection<IRawTaskEntity, BaseTaskId>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>ID of the collection to make editable</td></tr>
</tbody></table>

**Returns:**

Result&lt;[EditableCollection](EditableCollection.md)&lt;[IRawTaskEntity](../interfaces/IRawTaskEntity.md), [BaseTaskId](../type-aliases/BaseTaskId.md)&gt;&gt;

Result containing EditableCollection with persistence, or Failure
