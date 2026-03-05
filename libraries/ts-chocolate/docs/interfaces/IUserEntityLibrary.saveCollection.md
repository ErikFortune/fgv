[Home](../README.md) > [IUserEntityLibrary](./IUserEntityLibrary.md) > saveCollection

## IUserEntityLibrary.saveCollection() method

Save a collection's current in-memory state to its backing file tree.
Uses the persisted collection singleton for the full save pipeline.

**Signature:**

```typescript
saveCollection(collectionId: CollectionId, encryptionProvider?: IEncryptionProvider, subLibrary?: { collections: { has: any } }): Promise<Result<true>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>Collection to persist</td></tr>
<tr><td>encryptionProvider</td><td>IEncryptionProvider</td><td>Optional encryption provider for encrypted collections</td></tr>
<tr><td>subLibrary</td><td>{ collections: { has: any } }</td><td>Optional sub-library hint to disambiguate shared collection IDs</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;true&gt;&gt;

Result with `true` on success, or Failure with context
