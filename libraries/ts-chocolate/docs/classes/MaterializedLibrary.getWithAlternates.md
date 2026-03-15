[Home](../README.md) > [MaterializedLibrary](./MaterializedLibrary.md) > getWithAlternates

## MaterializedLibrary.getWithAlternates() method

Gets the preferred item and all alternates from an IIdsWithPreferred.
Returns a structured result with the primary item, alternates array, and original entity.

**Signature:**

```typescript
getWithAlternates(spec: IIdsWithPreferred<TId>): Result<IResolvedWithAlternates<TMaterialized, IIdsWithPreferred<TId>>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>IIdsWithPreferred&lt;TId&gt;</td><td>The IIdsWithPreferred specification</td></tr>
</tbody></table>

**Returns:**

Result&lt;IResolvedWithAlternates&lt;TMaterialized, [IIdsWithPreferred](../interfaces/IIdsWithPreferred.md)&lt;TId&gt;&gt;&gt;

Result with resolved primary, alternates, and entity
