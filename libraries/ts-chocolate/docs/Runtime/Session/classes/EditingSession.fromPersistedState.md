[Home](../../../README.md) > [Runtime](../../README.md) > [Session](../README.md) > [EditingSession](./EditingSession.md) > fromPersistedState

## EditingSession.fromPersistedState() method

Restores an editing session from a persisted state.
Restores the complete editing state including undo/redo history.

**Signature:**

```typescript
static fromPersistedState(data: IFillingSessionEntity, baseRecipe: IFillingRecipeVariation): Result<EditingSession>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>data</td><td>IFillingSessionEntity</td><td>Persisted session data</td></tr>
<tr><td>baseRecipe</td><td>IFillingRecipeVariation</td><td>Runtime recipe version to associate with the session</td></tr>
</tbody></table>

**Returns:**

Result&lt;[EditingSession](../../../classes/EditingSession.md)&gt;

Result with restored EditingSession
