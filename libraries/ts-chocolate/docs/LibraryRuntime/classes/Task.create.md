[Home](../../README.md) > [LibraryRuntime](../README.md) > [Task](./Task.md) > create

## Task.create() method

Factory method for creating a Task.
Parses the Mustache template and extracts required variables.

**Signature:**

```typescript
static create(context: ITaskContext, id: TaskId, task: IRawTaskEntity): Result<Task>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>ITaskContext</td><td>The runtime context for task resolution</td></tr>
<tr><td>id</td><td>TaskId</td><td>The composite task ID</td></tr>
<tr><td>task</td><td>IRawTaskEntity</td><td>The task data entity</td></tr>
</tbody></table>

**Returns:**

Result&lt;[Task](../../classes/Task.md)&gt;

Success with Task, or Failure if template parsing fails
