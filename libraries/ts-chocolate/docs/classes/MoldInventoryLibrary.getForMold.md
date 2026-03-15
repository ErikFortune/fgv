[Home](../README.md) > [MoldInventoryLibrary](./MoldInventoryLibrary.md) > getForMold

## MoldInventoryLibrary.getForMold() method

Gets the inventory entry for a specific mold by searching all entries.

**Signature:**

```typescript
getForMold(moldId: MoldId): Result<IMoldInventoryEntryEntity>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>moldId</td><td>MoldId</td><td>The composite MoldId of the mold to look up</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IMoldInventoryEntryEntity](../interfaces/IMoldInventoryEntryEntity.md)&gt;

Success with the inventory entry, or Failure if not found
