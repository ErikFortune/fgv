[Home](../README.md) > [ChocolateEntityLibrary](./ChocolateEntityLibrary.md) > getEditableDecorationsEntityCollection

## ChocolateEntityLibrary.getEditableDecorationsEntityCollection() method

Get an editable decorations collection with persistence enabled.

**Signature:**

```typescript
getEditableDecorationsEntityCollection(collectionId: CollectionId, encryptionProvider?: IEncryptionProvider): Result<EditableCollection<IDecorationEntity, BaseDecorationId>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>ID of the collection to make editable</td></tr>
<tr><td>encryptionProvider</td><td>IEncryptionProvider</td><td>Optional encryption provider for encrypted save support</td></tr>
</tbody></table>

**Returns:**

Result&lt;[EditableCollection](EditableCollection.md)&lt;[IDecorationEntity](../interfaces/IDecorationEntity.md), [BaseDecorationId](../type-aliases/BaseDecorationId.md)&gt;&gt;

Result containing EditableCollection with persistence, or Failure
