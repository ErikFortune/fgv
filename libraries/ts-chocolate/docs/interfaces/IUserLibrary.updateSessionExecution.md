[Home](../README.md) > [IUserLibrary](./IUserLibrary.md) > updateSessionExecution

## IUserLibrary.updateSessionExecution() method

Updates the execution state of an existing persisted session.

**Signature:**

```typescript
updateSessionExecution(sessionId: SessionId, execution: IExecutionState): Result<SessionId>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>sessionId</td><td>SessionId</td><td>Session to update</td></tr>
<tr><td>execution</td><td>IExecutionState</td><td>New execution state</td></tr>
</tbody></table>

**Returns:**

Result&lt;[SessionId](../type-aliases/SessionId.md)&gt;

Result with the composite SessionId
