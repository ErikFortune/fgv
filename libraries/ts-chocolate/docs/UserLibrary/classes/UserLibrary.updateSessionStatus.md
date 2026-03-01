[Home](../../README.md) > [UserLibrary](../README.md) > [UserLibrary](./UserLibrary.md) > updateSessionStatus

## UserLibrary.updateSessionStatus() method

Updates the status of an existing persisted session.

**Signature:**

```typescript
updateSessionStatus(sessionId: SessionId, status: PersistedSessionStatus): Result<SessionId>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>sessionId</td><td>SessionId</td><td>Session to update</td></tr>
<tr><td>status</td><td>PersistedSessionStatus</td><td>New session status</td></tr>
</tbody></table>

**Returns:**

Result&lt;[SessionId](../../type-aliases/SessionId.md)&gt;

Result with the composite SessionId
