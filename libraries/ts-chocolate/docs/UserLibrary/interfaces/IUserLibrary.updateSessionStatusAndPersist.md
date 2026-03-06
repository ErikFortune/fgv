[Home](../../README.md) > [UserLibrary](../README.md) > [IUserLibrary](./IUserLibrary.md) > updateSessionStatusAndPersist

## IUserLibrary.updateSessionStatusAndPersist() method

Updates session status and persists the owning sessions collection.

**Signature:**

```typescript
updateSessionStatusAndPersist(sessionId: SessionId, status: PersistedSessionStatus): Promise<Result<SessionId>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>sessionId</td><td>SessionId</td><td>Session to update</td></tr>
<tr><td>status</td><td>PersistedSessionStatus</td><td>New session status</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[SessionId](../../type-aliases/SessionId.md)&gt;&gt;

Promise with Result containing the composite SessionId
