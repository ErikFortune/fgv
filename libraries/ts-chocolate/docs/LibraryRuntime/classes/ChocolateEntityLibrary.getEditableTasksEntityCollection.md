[Home](../../README.md) > [LibraryRuntime](../README.md) > [ChocolateEntityLibrary](./ChocolateEntityLibrary.md) > getEditableTasksEntityCollection

## ChocolateEntityLibrary.getEditableTasksEntityCollection() method

Get an editable tasks collection with persistence enabled.

**Signature:**

```typescript
getEditableTasksEntityCollection(collectionId: CollectionId, encryptionProvider?: IEncryptionProvider): Result<EditableCollection<IRawTaskEntity, BaseTaskId>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>ID of the collection to make editable</td></tr>
<tr><td>encryptionProvider</td><td>IEncryptionProvider</td><td>Optional encryption provider for encrypted save support</td></tr>
</tbody></table>

**Returns:**

Result&lt;[EditableCollection](../../classes/EditableCollection.md)&lt;[IRawTaskEntity](../../interfaces/IRawTaskEntity.md), [BaseTaskId](../../type-aliases/BaseTaskId.md)&gt;&gt;

Result containing EditableCollection with persistence, or Failure
