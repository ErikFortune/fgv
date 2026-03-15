[Home](../README.md) > [FillingsLibrary](./FillingsLibrary.md) > createAsync

## FillingsLibrary.createAsync() method

Creates a new FillingsLibrary instance asynchronously with encryption support.

Use this factory method when you need to decrypt encrypted collections.
Pass encryption config via `params.encryption`.

**Signature:**

```typescript
static createAsync(params?: IFillingsLibraryAsyncParams): Promise<Result<FillingsLibrary>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IFillingsLibraryAsyncParams</td><td>Optional creation parameters with initial collections and encryption config</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[FillingsLibrary](FillingsLibrary.md)&gt;&gt;

Promise resolving to Success with new instance, or Failure with error message
