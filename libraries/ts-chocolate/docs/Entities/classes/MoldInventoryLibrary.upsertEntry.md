[Home](../../README.md) > [Entities](../README.md) > [MoldInventoryLibrary](./MoldInventoryLibrary.md) > upsertEntry

## MoldInventoryLibrary.upsertEntry() method

Adds or updates an inventory entry.

**Signature:**

```typescript
upsertEntry(collectionId: CollectionId, entryId: MoldInventoryEntryBaseId, entry: IMoldInventoryEntryEntity): Result<MoldInventoryEntryId>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>The inventory collection to upsert into</td></tr>
<tr><td>entryId</td><td>MoldInventoryEntryBaseId</td><td>The base ID for this inventory entry</td></tr>
<tr><td>entry</td><td>IMoldInventoryEntryEntity</td><td>The inventory entry data</td></tr>
</tbody></table>

**Returns:**

Result&lt;[MoldInventoryEntryId](../../type-aliases/MoldInventoryEntryId.md)&gt;

Success with the composite entry ID, or Failure if upsert fails
