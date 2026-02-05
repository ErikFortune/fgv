[Home](../README.md) > [SessionLibrary](./SessionLibrary.md) > getSessionsForConfectionVersion

## SessionLibrary.getSessionsForConfectionVersion() method

Gets all confection sessions for a specific confection version (across all collections)

**Signature:**

```typescript
getSessionsForConfectionVersion(versionId: ConfectionRecipeVariationId): readonly IConfectionSessionEntity[];
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>versionId</td><td>ConfectionRecipeVariationId</td><td>The ConfectionRecipeVariationId | confection version ID to search for</td></tr>
</tbody></table>

**Returns:**

readonly [IConfectionSessionEntity](../interfaces/IConfectionSessionEntity.md)[]

Array of confection sessions (empty if none found)
