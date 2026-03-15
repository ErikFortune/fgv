[Home](../README.md) > [TaskEditorContext](./TaskEditorContext.md) > createFromCollection

## TaskEditorContext.createFromCollection() method

Create a task editor context from a collection.

**Signature:**

```typescript
static createFromCollection(collection: EditableCollection<IRawTaskEntity, BaseTaskId>): Result<TaskEditorContext>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collection</td><td>EditableCollection&lt;IRawTaskEntity, BaseTaskId&gt;</td><td>Mutable collection of tasks</td></tr>
</tbody></table>

**Returns:**

Result&lt;[TaskEditorContext](TaskEditorContext.md)&gt;

Result containing the editor context or failure
