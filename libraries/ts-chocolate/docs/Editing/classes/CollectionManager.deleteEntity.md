[Home](../../README.md) > [Editing](../README.md) > [CollectionManager](./CollectionManager.md) > deleteEntity

## CollectionManager.deleteEntity() method

Delete an entity from its owning collection.

**Signature:**

```typescript
deleteEntity(compositeId: string): Result<unknown>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>compositeId</td><td>string</td><td>Composite entity ID (collectionId.baseId)</td></tr>
</tbody></table>

**Returns:**

Result&lt;unknown&gt;

Result containing the deleted entity or failure
