[Home](../../README.md) > [UserLibrary](../README.md) > [IUserLibrary](./IUserLibrary.md) > removeSessionAndPersist

## IUserLibrary.removeSessionAndPersist() method

Removes a session and persists the owning sessions collection.

**Signature:**

```typescript
removeSessionAndPersist(sessionId: SessionId): Promise<Result<SessionId>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>sessionId</td><td>SessionId</td><td>Session to remove</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[SessionId](../../type-aliases/SessionId.md)&gt;&gt;

Promise with Result containing the composite SessionId of the removed session
