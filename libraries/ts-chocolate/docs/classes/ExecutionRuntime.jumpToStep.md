[Home](../README.md) > [ExecutionRuntime](./ExecutionRuntime.md) > jumpToStep

## ExecutionRuntime.jumpToStep() method

Jumps to a specific step, appending a new active entry.
Supports repeating earlier steps — the log always rolls forward.

**Signature:**

```typescript
jumpToStep(stepIndex: number): Result<IExecutionState>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>stepIndex</td><td>number</td><td>Target step index (0-based)</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IExecutionState](../interfaces/IExecutionState.md)&gt;

Result with updated execution state
