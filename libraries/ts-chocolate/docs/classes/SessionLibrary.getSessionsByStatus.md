[Home](../README.md) > [SessionLibrary](./SessionLibrary.md) > getSessionsByStatus

## SessionLibrary.getSessionsByStatus() method

Gets all sessions with a specific status (across all collections)

**Signature:**

```typescript
getSessionsByStatus(status: PersistedSessionStatus): readonly AnySessionEntity[];
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>status</td><td>PersistedSessionStatus</td><td>The Entities.Session.PersistedSessionStatus | status to filter by</td></tr>
</tbody></table>

**Returns:**

readonly [AnySessionEntity](../type-aliases/AnySessionEntity.md)[]

Array of sessions with that status (empty if none found)
