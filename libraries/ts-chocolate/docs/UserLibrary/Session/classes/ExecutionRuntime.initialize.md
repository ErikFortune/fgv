[Home](../../../README.md) > [UserLibrary](../../README.md) > [Session](../README.md) > [ExecutionRuntime](./ExecutionRuntime.md) > initialize

## ExecutionRuntime.initialize() method

Creates initial execution state for a procedure with the given steps.
All steps start as pending with currentStepIndex at 0.

**Signature:**

```typescript
static initialize(steps: readonly IProcedureStepEntity[]): IExecutionState;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>steps</td><td>readonly IProcedureStepEntity[]</td><td>Procedure step definitions</td></tr>
</tbody></table>

**Returns:**

[IExecutionState](../../../interfaces/IExecutionState.md)

Initial execution state
