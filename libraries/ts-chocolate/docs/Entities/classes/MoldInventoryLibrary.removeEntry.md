[Home](../../README.md) > [Entities](../README.md) > [MoldInventoryLibrary](./MoldInventoryLibrary.md) > removeEntry

## MoldInventoryLibrary.removeEntry() method

Removes an inventory entry by its composite entry ID.

**Signature:**

```typescript
removeEntry(entryId: MoldInventoryEntryId): Result<IMoldInventoryEntryEntity>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>entryId</td><td>MoldInventoryEntryId</td><td>The composite inventory entry ID to remove</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IMoldInventoryEntryEntity](../../interfaces/IMoldInventoryEntryEntity.md)&gt;

Success with the removed entry, or Failure if not found or remove fails
