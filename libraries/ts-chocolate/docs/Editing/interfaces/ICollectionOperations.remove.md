[Home](../../README.md) > [Editing](../README.md) > [ICollectionOperations](./ICollectionOperations.md) > remove

## ICollectionOperations.remove() method

Remove an entity from the collection.

**Signature:**

```typescript
remove(baseId: TBaseId): Result<T>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>baseId</td><td>TBaseId</td><td>Base entity ID to remove</td></tr>
</tbody></table>

**Returns:**

Result&lt;T&gt;

Success with the removed entity, or Failure if not found or immutable
