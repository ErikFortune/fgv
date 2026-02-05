[Home](../../README.md) > [Entities](../README.md) > [MoldInventoryLibrary](./MoldInventoryLibrary.md) > removeForMold

## MoldInventoryLibrary.removeForMold() method

Removes an inventory entry for a specific mold.
Searches all collections for the entry with matching moldId.

**Signature:**

```typescript
removeForMold(moldId: MoldId): Result<IMoldInventoryEntryEntity>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>moldId</td><td>MoldId</td><td>The composite MoldId of the mold whose inventory to remove</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IMoldInventoryEntryEntity](../../interfaces/IMoldInventoryEntryEntity.md)&gt;

Success with the removed entry, or Failure if not found or remove fails
