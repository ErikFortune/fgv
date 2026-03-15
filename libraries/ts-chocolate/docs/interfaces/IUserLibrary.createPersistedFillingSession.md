[Home](../README.md) > [IUserLibrary](./IUserLibrary.md) > createPersistedFillingSession

## IUserLibrary.createPersistedFillingSession() method

Creates a new persisted filling session from a filling variation.
The session is created, persisted to the entity library, and the composite SessionId is returned.

**Signature:**

```typescript
createPersistedFillingSession(variationId: FillingRecipeVariationId, options: ICreateFillingSessionOptions): Result<SessionId>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>variationId</td><td>FillingRecipeVariationId</td><td>Source filling variation to create session for</td></tr>
<tr><td>options</td><td>ICreateFillingSessionOptions</td><td>Creation options including target collection</td></tr>
</tbody></table>

**Returns:**

Result&lt;[SessionId](../type-aliases/SessionId.md)&gt;

Result with the composite SessionId
