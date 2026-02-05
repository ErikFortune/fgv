[Home](../../README.md) > [Entities](../README.md) > [SessionLibrary](./SessionLibrary.md) > getSession

## SessionLibrary.getSession() method

Gets a session by ID (searches all collections)

**Signature:**

```typescript
getSession(sessionId: SessionId): Result<AnySessionEntity>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>sessionId</td><td>SessionId</td><td>The session ID to look up</td></tr>
</tbody></table>

**Returns:**

Result&lt;[AnySessionEntity](../../type-aliases/AnySessionEntity.md)&gt;

Success with the session, or Failure if not found
