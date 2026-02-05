[Home](../../README.md) > [UserRuntime](../README.md) > [UserLibraryRuntime](./UserLibraryRuntime.md) > createFillingSession

## UserLibraryRuntime.createFillingSession() method

Creates a new persisted filling session from a filling version.
The session is created and persisted immediately.

**Signature:**

```typescript
createFillingSession(versionId: FillingRecipeVariationId, options: ICreateFillingSessionOptions): Result<IFillingSessionEntity>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>versionId</td><td>FillingRecipeVariationId</td><td>Source filling version to create session for</td></tr>
<tr><td>options</td><td>ICreateFillingSessionOptions</td><td>Creation options including target collection</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IFillingSessionEntity](../../interfaces/IFillingSessionEntity.md)&gt;

Result with the created persisted session
