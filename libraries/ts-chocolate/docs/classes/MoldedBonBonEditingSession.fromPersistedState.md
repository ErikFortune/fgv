[Home](../README.md) > [MoldedBonBonEditingSession](./MoldedBonBonEditingSession.md) > fromPersistedState

## MoldedBonBonEditingSession.fromPersistedState() method

Restores a MoldedBonBonEditingSession from persisted state.
Note: Child filling sessions are persisted separately and should be accessed
via their persisted session IDs from IPersistedConfectionSession.childSessionIds.

**Signature:**

```typescript
static fromPersistedState(baseConfection: MoldedBonBonRecipe, history: ISerializedEditingHistoryEntity<IProducedMoldedBonBonEntity>, context: ISessionContext, params?: IConfectionEditingSessionParams): Result<MoldedBonBonEditingSession>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>baseConfection</td><td>MoldedBonBonRecipe</td><td>The source molded bonbon confection</td></tr>
<tr><td>history</td><td>ISerializedEditingHistoryEntity&lt;IProducedMoldedBonBonEntity&gt;</td><td>Serialized editing history</td></tr>
<tr><td>context</td><td>ISessionContext</td><td>The runtime context</td></tr>
<tr><td>params</td><td>IConfectionEditingSessionParams</td><td>Optional session parameters</td></tr>
</tbody></table>

**Returns:**

Result&lt;[MoldedBonBonEditingSession](MoldedBonBonEditingSession.md)&gt;

Success with restored session, or Failure
