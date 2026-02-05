[Home](../../README.md) > [Entities](../README.md) > [SessionLibrary](./SessionLibrary.md) > upsertSession

## SessionLibrary.upsertSession() method

Adds or updates a session in a collection.
If a session with the same baseId exists, it will be replaced.

**Signature:**

```typescript
upsertSession(collectionId: CollectionId, session: AnySessionEntity): Result<SessionId>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>The collection to upsert into</td></tr>
<tr><td>session</td><td>AnySessionEntity</td><td>The session to add or update</td></tr>
</tbody></table>

**Returns:**

Result&lt;[SessionId](../../type-aliases/SessionId.md)&gt;

Success with the composite session ID, or Failure if upsert fails
