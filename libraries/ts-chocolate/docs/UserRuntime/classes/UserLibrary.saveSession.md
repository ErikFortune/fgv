[Home](../../README.md) > [UserRuntime](../README.md) > [UserLibrary](./UserLibrary.md) > saveSession

## UserLibrary.saveSession() method

Saves an active session back to the library.

**Signature:**

```typescript
saveSession(sessionId: SessionId): Result<AnySessionEntity>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>sessionId</td><td>SessionId</td><td>Session to save</td></tr>
</tbody></table>

**Returns:**

Result&lt;[AnySessionEntity](../../type-aliases/AnySessionEntity.md)&gt;

Result with the updated persisted session
