[Home](../../README.md) > [Entities](../README.md) > [MoldInventoryLibrary](./MoldInventoryLibrary.md) > createAsync

## MoldInventoryLibrary.createAsync() method

Creates a MoldInventoryLibrary instance asynchronously with encrypted file support.

**Signature:**

```typescript
static createAsync(params?: IMoldInventoryLibraryAsyncParams): Promise<Result<MoldInventoryLibrary>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IMoldInventoryLibraryAsyncParams</td><td>Entities.Inventory.IMoldInventoryLibraryAsyncParams | Async creation parameters</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[MoldInventoryLibrary](../../classes/MoldInventoryLibrary.md)&gt;&gt;

Promise resolving to Success with new instance, or Failure
