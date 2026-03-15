[Home](../README.md) > [ExecutionRuntime](./ExecutionRuntime.md) > from

## ExecutionRuntime.from() method

Creates an ExecutionRuntime from persisted state and procedure steps.

**Signature:**

```typescript
static from(state: IExecutionState, steps: readonly IProcedureStepEntity[]): ExecutionRuntime;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>state</td><td>IExecutionState</td><td>Persisted execution state</td></tr>
<tr><td>steps</td><td>readonly IProcedureStepEntity[]</td><td>Procedure step definitions</td></tr>
</tbody></table>

**Returns:**

[ExecutionRuntime](ExecutionRuntime.md)

ExecutionRuntime instance
