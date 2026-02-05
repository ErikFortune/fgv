[Home](../../README.md) > [Entities](../README.md) > [JournalLibrary](./JournalLibrary.md) > createAsync

## JournalLibrary.createAsync() method

Creates a JournalLibrary instance asynchronously with encrypted file support.

**Signature:**

```typescript
static createAsync(params?: IJournalLibraryAsyncParams): Promise<Result<JournalLibrary>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IJournalLibraryAsyncParams</td><td>Entities.Journal.IJournalLibraryAsyncParams | Async creation parameters</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[JournalLibrary](../../classes/JournalLibrary.md)&gt;&gt;

Promise resolving to Success with new instance, or Failure
