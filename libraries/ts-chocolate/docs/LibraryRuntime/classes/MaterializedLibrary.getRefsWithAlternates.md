[Home](../../README.md) > [LibraryRuntime](../README.md) > [MaterializedLibrary](./MaterializedLibrary.md) > getRefsWithAlternates

## MaterializedLibrary.getRefsWithAlternates() method

Gets the preferred item and all alternates from an IOptionsWithPreferred containing IRefWithNotes.
Preserves notes from each reference.

**Signature:**

```typescript
getRefsWithAlternates(spec: IOptionsWithPreferred<IRefWithNotes<TId>, TId>): Result<IResolvedRefWithAlternates<TId, TMaterialized>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>IOptionsWithPreferred&lt;IRefWithNotes&lt;TId&gt;, TId&gt;</td><td>The IOptionsWithPreferred specification with refs containing notes</td></tr>
</tbody></table>

**Returns:**

Result&lt;IResolvedRefWithAlternates&lt;TId, TMaterialized&gt;&gt;

Result with resolved primary and alternates with their notes
