[Home](../../README.md) > [Session](../README.md) > [ConfectionEditingSessionBase](./ConfectionEditingSessionBase.md) > toPersistedState

## ConfectionEditingSessionBase.toPersistedState() method

Creates a persisted session state from this confection editing session.
Captures the complete editing state including undo/redo history.

Note: Child filling sessions are persisted separately. The `childSessionIds`
field is left empty and should be populated by the caller when persisting
the complete session graph.

**Signature:**

```typescript
toPersistedState(options: { collectionId: CollectionId; baseId?: BaseSessionId; status?: PersistedSessionStatus; label?: string; notes?: ICategorizedNote[] }): Result<IConfectionSessionEntity>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>options</td><td>{ collectionId: CollectionId; baseId?: BaseSessionId; status?: PersistedSessionStatus; label?: string; notes?: ICategorizedNote[] }</td><td>Persistence options including collection ID</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IConfectionSessionEntity](../../interfaces/IConfectionSessionEntity.md)&gt;

Result with persisted confection session
