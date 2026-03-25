[Home](../README.md) > [AggregatedResultMapBase](./AggregatedResultMapBase.md) > getCollectionMetadata

## AggregatedResultMapBase.getCollectionMetadata() method

Gets the metadata for a specific collection.

**Signature:**

```typescript
getCollectionMetadata(collectionId: TCOLLECTIONID): Result<TMETADATA | undefined>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>TCOLLECTIONID</td><td>The collection ID.</td></tr>
</tbody></table>

**Returns:**

[Result](../type-aliases/Result.md)&lt;TMETADATA | undefined&gt;

`Success` with the metadata if found, `Failure` otherwise.
