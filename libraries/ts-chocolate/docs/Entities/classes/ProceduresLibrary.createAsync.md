[Home](../../README.md) > [Entities](../README.md) > [ProceduresLibrary](./ProceduresLibrary.md) > createAsync

## ProceduresLibrary.createAsync() method

Creates a new ProceduresLibrary instance asynchronously with encryption support.

Use this factory method when you need to decrypt encrypted collections.
Pass encryption config via `params.encryption`.

**Signature:**

```typescript
static createAsync(params?: IProceduresLibraryAsyncParams): Promise<Result<ProceduresLibrary>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IProceduresLibraryAsyncParams</td><td>Optional creation parameters with initial collections and encryption config</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[ProceduresLibrary](../../classes/ProceduresLibrary.md)&gt;&gt;

Promise resolving to Success with new instance, or Failure with error message
