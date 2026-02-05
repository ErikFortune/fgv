[Home](../README.md) > [SessionLibrary](./SessionLibrary.md) > getSessionsForFilling

## SessionLibrary.getSessionsForFilling() method

Gets all filling sessions for a filling (across all versions and collections)

**Signature:**

```typescript
getSessionsForFilling(fillingId: FillingId): readonly IFillingSessionEntity[];
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>fillingId</td><td>FillingId</td><td>The FillingId | filling ID to search for</td></tr>
</tbody></table>

**Returns:**

readonly [IFillingSessionEntity](../interfaces/IFillingSessionEntity.md)[]

Array of filling sessions (empty if none found)
