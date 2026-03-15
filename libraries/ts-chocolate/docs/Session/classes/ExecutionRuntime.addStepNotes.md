[Home](../../README.md) > [Session](../README.md) > [ExecutionRuntime](./ExecutionRuntime.md) > addStepNotes

## ExecutionRuntime.addStepNotes() method

Adds a note to the current step's active log entry.

**Signature:**

```typescript
addStepNotes(notes: readonly ICategorizedNote[]): Result<IExecutionState>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>notes</td><td>readonly ICategorizedNote[]</td><td>Notes to add</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IExecutionState](../../interfaces/IExecutionState.md)&gt;

Result with updated execution state
