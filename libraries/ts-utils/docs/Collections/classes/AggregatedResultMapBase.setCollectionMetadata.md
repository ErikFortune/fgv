[Home](../../README.md) > [Collections](../README.md) > [AggregatedResultMapBase](./AggregatedResultMapBase.md) > setCollectionMetadata

## AggregatedResultMapBase.setCollectionMetadata() method

Sets the metadata for a mutable collection.

**Signature:**

```typescript
setCollectionMetadata(collectionId: TCOLLECTIONID, metadata: TMETADATA): Result<TMETADATA>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>TCOLLECTIONID</td><td>The collection ID.</td></tr>
<tr><td>metadata</td><td>TMETADATA</td><td>The metadata to set.</td></tr>
</tbody></table>

**Returns:**

[Result](../../type-aliases/Result.md)&lt;TMETADATA&gt;

`Success` if set, `Failure` otherwise.
