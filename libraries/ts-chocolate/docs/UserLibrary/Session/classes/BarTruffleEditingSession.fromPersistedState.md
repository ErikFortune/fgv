[Home](../../../README.md) > [UserLibrary](../../README.md) > [Session](../README.md) > [BarTruffleEditingSession](./BarTruffleEditingSession.md) > fromPersistedState

## BarTruffleEditingSession.fromPersistedState() method

Restores a BarTruffleEditingSession from persisted state.
Note: Child filling sessions are persisted separately and should be accessed
via their persisted session IDs from IPersistedConfectionSession.childSessionIds.

**Signature:**

```typescript
static fromPersistedState(baseConfection: T, history: ISerializedEditingHistoryEntity<IProducedBarTruffleEntity>, context: ISessionContext, params?: IConfectionEditingSessionParams): Result<BarTruffleEditingSession<T>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>baseConfection</td><td>T</td><td>The source bar truffle confection</td></tr>
<tr><td>history</td><td>ISerializedEditingHistoryEntity&lt;IProducedBarTruffleEntity&gt;</td><td>Serialized editing history</td></tr>
<tr><td>context</td><td>ISessionContext</td><td>The runtime context</td></tr>
<tr><td>params</td><td>IConfectionEditingSessionParams</td><td>Optional session parameters</td></tr>
</tbody></table>

**Returns:**

Result&lt;[BarTruffleEditingSession](../../../classes/BarTruffleEditingSession.md)&lt;T&gt;&gt;

Success with restored session, or Failure
