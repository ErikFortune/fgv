[Home](../README.md) > [MaterializedLibrary](./MaterializedLibrary.md) > clearCacheEntry

## MaterializedLibrary.clearCacheEntry() method

Clears a single cached materialized object by ID.

More targeted than MaterializedLibrary.clearCache | clearCache(): only
evicts the specified entry, leaving all other cached objects intact.

**Signature:**

```typescript
clearCacheEntry(id: TId): void;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>id</td><td>TId</td><td>The composite ID of the entry to evict</td></tr>
</tbody></table>

**Returns:**

void
