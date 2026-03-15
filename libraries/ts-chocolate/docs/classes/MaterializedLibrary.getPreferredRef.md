[Home](../README.md) > [MaterializedLibrary](./MaterializedLibrary.md) > getPreferredRef

## MaterializedLibrary.getPreferredRef() method

Gets the preferred (or first) materialized item from an IOptionsWithPreferred<IRefWithNotes>.
Only materializes the primary item - more efficient when alternates aren't needed.

**Signature:**

```typescript
getPreferredRef(spec: IOptionsWithPreferred<IRefWithNotes<TId>, TId>): Result<{ item: TMaterialized; id: TId; notes?: readonly ICategorizedNote[] }>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>IOptionsWithPreferred&lt;IRefWithNotes&lt;TId&gt;, TId&gt;</td><td>The IOptionsWithPreferred specification with refs</td></tr>
</tbody></table>

**Returns:**

Result&lt;{ item: TMaterialized; id: TId; notes?: readonly [ICategorizedNote](../interfaces/ICategorizedNote.md)[] }&gt;

Result with the preferred materialized item and its notes
