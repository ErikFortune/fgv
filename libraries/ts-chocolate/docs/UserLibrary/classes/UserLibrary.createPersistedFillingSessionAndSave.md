[Home](../../README.md) > [UserLibrary](../README.md) > [UserLibrary](./UserLibrary.md) > createPersistedFillingSessionAndSave

## UserLibrary.createPersistedFillingSessionAndSave() method

Creates and persists a new filling session in one orchestrated operation.
Persists to backing storage when supported by the target collection.

**Signature:**

```typescript
createPersistedFillingSessionAndSave(variationId: FillingRecipeVariationId, options: ICreateFillingSessionOptions): Promise<Result<SessionId>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>variationId</td><td>FillingRecipeVariationId</td><td>Source filling variation to create session for</td></tr>
<tr><td>options</td><td>ICreateFillingSessionOptions</td><td>Creation options including target collection</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[SessionId](../../type-aliases/SessionId.md)&gt;&gt;

Promise with Result containing the composite SessionId
