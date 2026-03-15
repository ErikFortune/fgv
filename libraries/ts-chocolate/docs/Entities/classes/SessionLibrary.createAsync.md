[Home](../../README.md) > [Entities](../README.md) > [SessionLibrary](./SessionLibrary.md) > createAsync

## SessionLibrary.createAsync() method

Creates a SessionLibrary instance asynchronously with encrypted file support.

**Signature:**

```typescript
static createAsync(params?: ISessionLibraryAsyncParams): Promise<Result<SessionLibrary>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>ISessionLibraryAsyncParams</td><td>Entities.Session.ISessionLibraryAsyncParams | Async creation parameters</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[SessionLibrary](../../classes/SessionLibrary.md)&gt;&gt;

Promise resolving to Success with new instance, or Failure
