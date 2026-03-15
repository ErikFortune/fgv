[Home](../README.md) > [SessionLibrary](./SessionLibrary.md) > addSession

## SessionLibrary.addSession() method

Adds a new session to a collection.
Fails if a session with the same baseId already exists in the collection.

**Signature:**

```typescript
addSession(collectionId: CollectionId, session: AnySessionEntity): Result<SessionId>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>The collection to add to</td></tr>
<tr><td>session</td><td>AnySessionEntity</td><td>The session to add</td></tr>
</tbody></table>

**Returns:**

Result&lt;[SessionId](../type-aliases/SessionId.md)&gt;

Success with the composite session ID, or Failure if add fails
