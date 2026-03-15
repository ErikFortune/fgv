[Home](../README.md) > [IngredientInventoryLibrary](./IngredientInventoryLibrary.md) > createAsync

## IngredientInventoryLibrary.createAsync() method

Creates an IngredientInventoryLibrary instance asynchronously with encrypted file support.

**Signature:**

```typescript
static createAsync(params?: IIngredientInventoryLibraryAsyncParams): Promise<Result<IngredientInventoryLibrary>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IIngredientInventoryLibraryAsyncParams</td><td>Entities.Inventory.IIngredientInventoryLibraryAsyncParams | Async creation parameters</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[IngredientInventoryLibrary](IngredientInventoryLibrary.md)&gt;&gt;

Promise resolving to Success with new instance, or Failure
