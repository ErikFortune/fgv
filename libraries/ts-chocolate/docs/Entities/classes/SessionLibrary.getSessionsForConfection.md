[Home](../../README.md) > [Entities](../README.md) > [SessionLibrary](./SessionLibrary.md) > getSessionsForConfection

## SessionLibrary.getSessionsForConfection() method

Gets all confection sessions for a confection (across all versions and collections)

**Signature:**

```typescript
getSessionsForConfection(confectionId: ConfectionId): readonly IConfectionSessionEntity[];
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>confectionId</td><td>ConfectionId</td><td>The ConfectionId | confection ID to search for</td></tr>
</tbody></table>

**Returns:**

readonly [IConfectionSessionEntity](../../interfaces/IConfectionSessionEntity.md)[]

Array of confection sessions (empty if none found)
