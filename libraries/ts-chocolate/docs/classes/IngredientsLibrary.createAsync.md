[Home](../README.md) > [IngredientsLibrary](./IngredientsLibrary.md) > createAsync

## IngredientsLibrary.createAsync() method

Creates a new IngredientsLibrary instance asynchronously with encryption support.

Use this factory method when you need to decrypt encrypted collections.
Pass encryption config via `params.encryption`.

**Signature:**

```typescript
static createAsync(params?: IIngredientsLibraryAsyncParams): Promise<Result<IngredientsLibrary>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IIngredientsLibraryAsyncParams</td><td>Optional creation parameters with initial collections and encryption config</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[IngredientsLibrary](IngredientsLibrary.md)&gt;&gt;

Promise resolving to Success with new instance, or Failure with error message
