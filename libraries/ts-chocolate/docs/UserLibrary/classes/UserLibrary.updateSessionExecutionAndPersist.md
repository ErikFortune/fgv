[Home](../../README.md) > [UserLibrary](../README.md) > [UserLibrary](./UserLibrary.md) > updateSessionExecutionAndPersist

## UserLibrary.updateSessionExecutionAndPersist() method

Updates session execution state and persists the owning sessions collection.

**Signature:**

```typescript
updateSessionExecutionAndPersist(sessionId: SessionId, execution: IExecutionState): Promise<Result<SessionId>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>sessionId</td><td>SessionId</td><td>Session to update</td></tr>
<tr><td>execution</td><td>IExecutionState</td><td>New execution state</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[SessionId](../../type-aliases/SessionId.md)&gt;&gt;

Promise with Result containing the composite SessionId
