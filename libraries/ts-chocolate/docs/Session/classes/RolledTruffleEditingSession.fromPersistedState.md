[Home](../../README.md) > [Session](../README.md) > [RolledTruffleEditingSession](./RolledTruffleEditingSession.md) > fromPersistedState

## RolledTruffleEditingSession.fromPersistedState() method

Restores a RolledTruffleEditingSession from persisted state.
Note: Child filling sessions are persisted separately and should be accessed
via their persisted session IDs from IPersistedConfectionSession.childSessionIds.

**Signature:**

```typescript
static fromPersistedState(baseConfection: T, history: ISerializedEditingHistoryEntity<IProducedRolledTruffleEntity>, context: ISessionContext, params?: IConfectionEditingSessionParams): Result<RolledTruffleEditingSession<T>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>baseConfection</td><td>T</td><td>The source rolled truffle confection</td></tr>
<tr><td>history</td><td>ISerializedEditingHistoryEntity&lt;IProducedRolledTruffleEntity&gt;</td><td>Serialized editing history</td></tr>
<tr><td>context</td><td>ISessionContext</td><td>The runtime context</td></tr>
<tr><td>params</td><td>IConfectionEditingSessionParams</td><td>Optional session parameters</td></tr>
</tbody></table>

**Returns:**

Result&lt;[RolledTruffleEditingSession](../../classes/RolledTruffleEditingSession.md)&lt;T&gt;&gt;

Success with restored session, or Failure
