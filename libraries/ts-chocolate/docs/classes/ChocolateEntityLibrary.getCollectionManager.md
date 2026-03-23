[Home](../README.md) > [ChocolateEntityLibrary](./ChocolateEntityLibrary.md) > getCollectionManager

## ChocolateEntityLibrary.getCollectionManager() method

Get a persistence-aware collection manager for a given sub-library.

Returns a cached instance per sub-library — the manager is reused across
calls for the same sub-library reference.

**Signature:**

```typescript
getCollectionManager(subLibrary: SubLibraryBase<TCompositeId, TBaseId, TItem>): PersistedCollectionManager<TCompositeId, TBaseId, TItem>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>subLibrary</td><td>SubLibraryBase&lt;TCompositeId, TBaseId, TItem&gt;</td><td>The sub-library to manage</td></tr>
</tbody></table>

**Returns:**

[PersistedCollectionManager](PersistedCollectionManager.md)&lt;TCompositeId, TBaseId, TItem&gt;

A PersistedCollectionManager that automatically syncs changes to disk
