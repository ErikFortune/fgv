[Home](../README.md) > [SessionLibrary](./SessionLibrary.md) > getSessionsForFillingVersion

## SessionLibrary.getSessionsForFillingVersion() method

Gets all filling sessions for a specific filling version (across all collections)

**Signature:**

```typescript
getSessionsForFillingVersion(versionId: FillingVersionId): readonly IFillingSessionEntity[];
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>versionId</td><td>FillingVersionId</td><td>The FillingVersionId | filling version ID to search for</td></tr>
</tbody></table>

**Returns:**

readonly [IFillingSessionEntity](../interfaces/IFillingSessionEntity.md)[]

Array of filling sessions (empty if none found)
