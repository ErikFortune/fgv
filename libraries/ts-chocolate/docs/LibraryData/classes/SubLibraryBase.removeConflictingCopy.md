[Home](../../README.md) > [LibraryData](../README.md) > [SubLibraryBase](./SubLibraryBase.md) > removeConflictingCopy

## SubLibraryBase.removeConflictingCopy() method

Removes one conflicting (losing) copy of a collection and deletes its backing file.

Use this to repair a collection ID collision after inspecting the conflict via
`collectionConflicts`. Identifies the copy by its `sourceName`.

To remove the active (winning) copy instead, use `removeCollection` (loaded)
or `removeProtectedCollection` (encrypted).

**Signature:**

```typescript
removeConflictingCopy(collectionId: string, sourceName: string | undefined): Result<true>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>string</td><td>The collection ID with a conflict.</td></tr>
<tr><td>sourceName</td><td>string | undefined</td><td>The `sourceName` of the conflicting copy to remove.</td></tr>
</tbody></table>

**Returns:**

Result&lt;true&gt;

Result<true> on success, or Failure if the conflict or copy is not found.
