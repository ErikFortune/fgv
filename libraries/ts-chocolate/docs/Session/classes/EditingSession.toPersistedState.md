[Home](../../README.md) > [Session](../README.md) > [EditingSession](./EditingSession.md) > toPersistedState

## EditingSession.toPersistedState() method

Creates a persisted session state from this editing session.
Captures the complete editing state including undo/redo history.

**Signature:**

```typescript
toPersistedState(options: { collectionId: CollectionId; baseId?: BaseSessionId; status?: PersistedSessionStatus; label?: string; notes?: ICategorizedNote[] }): Result<IFillingSessionEntity>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>options</td><td>{ collectionId: CollectionId; baseId?: BaseSessionId; status?: PersistedSessionStatus; label?: string; notes?: ICategorizedNote[] }</td><td>Persistence options including collection ID</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IFillingSessionEntity](../../interfaces/IFillingSessionEntity.md)&gt;

Result with persisted filling session
