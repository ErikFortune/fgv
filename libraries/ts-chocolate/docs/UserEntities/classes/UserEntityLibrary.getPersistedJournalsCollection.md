[Home](../../README.md) > [UserEntities](../README.md) > [UserEntityLibrary](./UserEntityLibrary.md) > getPersistedJournalsCollection

## UserEntityLibrary.getPersistedJournalsCollection() method

Get or create a singleton persisted journals collection.

**Signature:**

```typescript
getPersistedJournalsCollection(collectionId: CollectionId): Result<PersistedEditableCollection<AnyJournalEntryEntity, BaseJournalId>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>ID of the collection</td></tr>
</tbody></table>

**Returns:**

Result&lt;[PersistedEditableCollection](../../classes/PersistedEditableCollection.md)&lt;[AnyJournalEntryEntity](../../type-aliases/AnyJournalEntryEntity.md), [BaseJournalId](../../type-aliases/BaseJournalId.md)&gt;&gt;

`Success` with persisted wrapper, or `Failure` if collection not found
