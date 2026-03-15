[Home](../README.md) > [ISessionContext](./ISessionContext.md) > createFillingSession

## ISessionContext.createFillingSession() method

Creates an editing session for a filling recipe at a target weight.
Used by confection sessions to manage filling scaling.

**Signature:**

```typescript
createFillingSession(filling: IFillingRecipe, targetWeight: Measurement): Result<EditingSession>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>filling</td><td>IFillingRecipe</td><td>The runtime filling recipe to create a session for</td></tr>
<tr><td>targetWeight</td><td>Measurement</td><td>Target weight for the filling in grams</td></tr>
</tbody></table>

**Returns:**

Result&lt;[EditingSession](../classes/EditingSession.md)&gt;

Success with EditingSession, or Failure if creation fails
