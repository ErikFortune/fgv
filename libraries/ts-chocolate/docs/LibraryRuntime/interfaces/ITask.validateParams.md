[Home](../../README.md) > [LibraryRuntime](../README.md) > [ITask](./ITask.md) > validateParams

## ITask.validateParams() method

Validates that params (combined with defaults) satisfy required variables.

**Signature:**

```typescript
validateParams(params: Record<string, unknown>): Result<ITaskRefValidation>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>Record&lt;string, unknown&gt;</td><td>The parameter values to validate</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ITaskRefValidation](../../interfaces/ITaskRefValidation.md)&gt;

Validation result with details about present/missing variables
