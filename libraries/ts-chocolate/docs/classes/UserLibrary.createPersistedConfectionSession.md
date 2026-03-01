[Home](../README.md) > [UserLibrary](./UserLibrary.md) > createPersistedConfectionSession

## UserLibrary.createPersistedConfectionSession() method

Creates a new persisted confection session from a confection recipe.
The session is created, persisted to the entity library, and the composite SessionId is returned.

**Signature:**

```typescript
createPersistedConfectionSession(confectionId: ConfectionId, options: ICreateConfectionSessionOptions): Result<SessionId>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>confectionId</td><td>ConfectionId</td><td>Source confection to create session for</td></tr>
<tr><td>options</td><td>ICreateConfectionSessionOptions</td><td>Creation options including target collection and optional session params</td></tr>
</tbody></table>

**Returns:**

Result&lt;[SessionId](../type-aliases/SessionId.md)&gt;

Result with the composite SessionId
