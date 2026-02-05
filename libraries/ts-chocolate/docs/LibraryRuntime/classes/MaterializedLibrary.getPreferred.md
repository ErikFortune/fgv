[Home](../../README.md) > [LibraryRuntime](../README.md) > [MaterializedLibrary](./MaterializedLibrary.md) > getPreferred

## MaterializedLibrary.getPreferred() method

Gets the preferred (or first) materialized item from an IIdsWithPreferred.

**Signature:**

```typescript
getPreferred(spec: IIdsWithPreferred<TId>): DetailedResult<TMaterialized, ResultMapResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>IIdsWithPreferred&lt;TId&gt;</td><td>The IIdsWithPreferred specification</td></tr>
</tbody></table>

**Returns:**

DetailedResult&lt;TMaterialized, ResultMapResultDetail&gt;

DetailedResult with the preferred materialized item
