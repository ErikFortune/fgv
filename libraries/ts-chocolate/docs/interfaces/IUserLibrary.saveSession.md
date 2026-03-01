[Home](../README.md) > [IUserLibrary](./IUserLibrary.md) > saveSession

## IUserLibrary.saveSession() method

Saves an active session back to the library.

**Signature:**

```typescript
saveSession(sessionId: SessionId): Result<SessionId>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>sessionId</td><td>SessionId</td><td>Session to save</td></tr>
</tbody></table>

**Returns:**

Result&lt;[SessionId](../type-aliases/SessionId.md)&gt;

Result with the composite SessionId
