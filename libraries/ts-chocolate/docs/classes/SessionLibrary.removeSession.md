[Home](../README.md) > [SessionLibrary](./SessionLibrary.md) > removeSession

## SessionLibrary.removeSession() method

Removes a session from its collection.

**Signature:**

```typescript
removeSession(sessionId: SessionId): Result<AnySessionEntity>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>sessionId</td><td>SessionId</td><td>The composite session ID to remove</td></tr>
</tbody></table>

**Returns:**

Result&lt;[AnySessionEntity](../type-aliases/AnySessionEntity.md)&gt;

Success with the removed session, or Failure if not found or remove fails
