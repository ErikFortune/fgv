[Home](../README.md) > [ConfectionsLibrary](./ConfectionsLibrary.md) > createAsync

## ConfectionsLibrary.createAsync() method

Creates a new ConfectionsLibrary instance asynchronously with encryption support.

Use this factory method when you need to decrypt encrypted collections.
Pass encryption config via `params.encryption`.

**Signature:**

```typescript
static createAsync(params?: IConfectionsLibraryAsyncParams): Promise<Result<ConfectionsLibrary>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IConfectionsLibraryAsyncParams</td><td>Optional creation parameters with initial collections and encryption config</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[ConfectionsLibrary](ConfectionsLibrary.md)&gt;&gt;

Promise resolving to Success with new instance, or Failure with error message
