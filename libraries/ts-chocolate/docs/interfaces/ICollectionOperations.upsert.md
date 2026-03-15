[Home](../README.md) > [ICollectionOperations](./ICollectionOperations.md) > upsert

## ICollectionOperations.upsert() method

Add or update an entity in the collection.

**Signature:**

```typescript
upsert(baseId: TBaseId, entity: T): Result<string>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>baseId</td><td>TBaseId</td><td>Base entity ID within the collection</td></tr>
<tr><td>entity</td><td>T</td><td>The entity to set</td></tr>
</tbody></table>

**Returns:**

Result&lt;string&gt;

Success with the composite ID string, or Failure if the upsert fails
