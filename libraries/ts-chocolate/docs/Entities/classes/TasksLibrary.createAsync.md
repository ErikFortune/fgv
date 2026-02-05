[Home](../../README.md) > [Entities](../README.md) > [TasksLibrary](./TasksLibrary.md) > createAsync

## TasksLibrary.createAsync() method

Creates a new TasksLibrary instance asynchronously with encryption support.

Use this factory method when you need to decrypt encrypted collections.
Pass encryption config via `params.encryption`.

**Signature:**

```typescript
static createAsync(params?: ITasksLibraryAsyncParams): Promise<Result<TasksLibrary>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>ITasksLibraryAsyncParams</td><td>Optional creation parameters with initial collections and encryption config</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[TasksLibrary](../../classes/TasksLibrary.md)&gt;&gt;

Promise resolving to Success with new instance, or Failure with error message
