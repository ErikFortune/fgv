[Home](../../../README.md) > [UserLibrary](../../README.md) > [Session](../README.md) > [MoldedBonBonEditingSession](./MoldedBonBonEditingSession.md) > fromPersistedState

## MoldedBonBonEditingSession.fromPersistedState() method

Restores a MoldedBonBonEditingSession from persisted state.
Note: Child filling sessions are persisted separately and should be accessed
via their persisted session IDs from IPersistedConfectionSession.childSessionIds.

**Signature:**

```typescript
static fromPersistedState(baseConfection: T, persistedEntity: IConfectionSessionEntity, context: ISessionContext, params?: IConfectionEditingSessionParams): Result<MoldedBonBonEditingSession<T>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>baseConfection</td><td>T</td><td>The source molded bonbon confection</td></tr>
<tr><td>persistedEntity</td><td>IConfectionSessionEntity</td><td></td></tr>
<tr><td>context</td><td>ISessionContext</td><td>The runtime context</td></tr>
<tr><td>params</td><td>IConfectionEditingSessionParams</td><td>Optional session parameters</td></tr>
</tbody></table>

**Returns:**

Result&lt;[MoldedBonBonEditingSession](../../../classes/MoldedBonBonEditingSession.md)&lt;T&gt;&gt;

Success with restored session, or Failure
