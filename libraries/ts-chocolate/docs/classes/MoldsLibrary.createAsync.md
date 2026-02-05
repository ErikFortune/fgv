[Home](../README.md) > [MoldsLibrary](./MoldsLibrary.md) > createAsync

## MoldsLibrary.createAsync() method

Creates a new MoldsLibrary instance asynchronously with encryption support.

Use this factory method when you need to decrypt encrypted collections.
Pass encryption config via `params.encryption`.

**Signature:**

```typescript
static createAsync(params?: IMoldsLibraryAsyncParams): Promise<Result<MoldsLibrary>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IMoldsLibraryAsyncParams</td><td>Optional creation parameters with initial collections and encryption config</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[MoldsLibrary](MoldsLibrary.md)&gt;&gt;

Promise resolving to Success with new instance, or Failure with error message
