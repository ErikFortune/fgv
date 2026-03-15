[Home](../README.md) > [UserEntityLibrary](./UserEntityLibrary.md) > getPersistedSessionsCollection

## UserEntityLibrary.getPersistedSessionsCollection() method

Get or create a singleton persisted sessions collection.

**Signature:**

```typescript
getPersistedSessionsCollection(collectionId: CollectionId): Result<PersistedEditableCollection<AnySessionEntity, BaseSessionId>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>ID of the collection</td></tr>
</tbody></table>

**Returns:**

Result&lt;[PersistedEditableCollection](PersistedEditableCollection.md)&lt;[AnySessionEntity](../type-aliases/AnySessionEntity.md), [BaseSessionId](../type-aliases/BaseSessionId.md)&gt;&gt;

`Success` with persisted wrapper, or `Failure` if collection not found
