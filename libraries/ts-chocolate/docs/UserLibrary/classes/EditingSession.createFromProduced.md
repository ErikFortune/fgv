[Home](../../README.md) > [UserLibrary](../README.md) > [EditingSession](./EditingSession.md) > createFromProduced

## EditingSession.createFromProduced() method

Creates a new EditingSession from an existing produced filling snapshot.
Used to restore embedded filling sessions from persisted confection state.

**Signature:**

```typescript
static createFromProduced(baseRecipe: IFillingRecipeVariation, producedEntity: IProducedFillingEntity): Result<EditingSession>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>baseRecipe</td><td>IFillingRecipeVariation</td><td>Source recipe variation</td></tr>
<tr><td>producedEntity</td><td>IProducedFillingEntity</td><td>Existing produced filling state to restore</td></tr>
</tbody></table>

**Returns:**

Result&lt;[EditingSession](../../classes/EditingSession.md)&gt;

Result with new EditingSession or error
