[Home](../../README.md) > [UserLibrary](../README.md) > [IUserLibrary](./IUserLibrary.md) > createFillingSession

## IUserLibrary.createFillingSession() method

Creates a new persisted filling session from a filling variation.
The session is created and persisted immediately.

**Signature:**

```typescript
createFillingSession(variationId: FillingRecipeVariationId, options: ICreateFillingSessionOptions): Result<IFillingSessionEntity>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>variationId</td><td>FillingRecipeVariationId</td><td>Source filling variation to create session for</td></tr>
<tr><td>options</td><td>ICreateFillingSessionOptions</td><td>Creation options including target collection</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IFillingSessionEntity](../../interfaces/IFillingSessionEntity.md)&gt;

Result with the created persisted session
