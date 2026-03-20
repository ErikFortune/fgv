[Home](../../README.md) > [LibraryData](../README.md) > [SubLibraryBase](./SubLibraryBase.md) > mergeConflictingCopyIntoActiveAsync

## SubLibraryBase.mergeConflictingCopyIntoActiveAsync() method

Merges a conflicting (loser) copy's items into the active (winning) collection.

Re-reads the loser's backing file (decrypting if necessary), merges its items
into the active collection, then deletes the loser's file.

**Signature:**

```typescript
mergeConflictingCopyIntoActiveAsync(collectionId: string, sourceName: string | undefined, onConflict: "skip" | "overwrite" | "rename", encryption?: IEncryptionConfig): Promise<Result<{ mergedCount: number; skippedCount: number; renamedItems: readonly { oldBaseId: string; newBaseId: string }[] }>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>string</td><td>The collection ID with a conflict.</td></tr>
<tr><td>sourceName</td><td>string | undefined</td><td>The `sourceName` of the conflicting copy to merge.</td></tr>
<tr><td>onConflict</td><td>"skip" | "overwrite" | "rename"</td><td>Strategy for handling duplicate base IDs.</td></tr>
<tr><td>encryption</td><td>IEncryptionConfig</td><td>Optional encryption config for encrypted copies.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;{ mergedCount: number; skippedCount: number; renamedItems: readonly { oldBaseId: string; newBaseId: string }[] }&gt;&gt;

Result with merge statistics, or Failure.
