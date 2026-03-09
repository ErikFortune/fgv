[Home](../../README.md) > [UserLibrary](../README.md) > [UserLibrary](./UserLibrary.md) > invalidateCacheEntry

## UserLibrary.invalidateCacheEntry() method

Evicts a single entry from the appropriate MaterializedLibrary cache.

More targeted than IUserLibrary.clearCache | clearCache(): only
evicts the specified entry, leaving all other cached materialized objects
(including in-progress editing sessions) intact.

**Signature:**

```typescript
invalidateCacheEntry(subLibraryId: SubLibraryId, compositeId: string): void;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>subLibraryId</td><td>SubLibraryId</td><td>Identifies which sub-library was mutated</td></tr>
<tr><td>compositeId</td><td>string</td><td>The composite entity ID (`collectionId.baseId`) to evict</td></tr>
</tbody></table>

**Returns:**

void
