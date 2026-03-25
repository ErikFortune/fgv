[Home](../../README.md) > [Collections](../README.md) > [AggregatedResultMapBase](./AggregatedResultMapBase.md) > deleteFromCollection

## AggregatedResultMapBase.deleteFromCollection() method

Deletes an item using separate collection and item IDs.

**Signature:**

```typescript
deleteFromCollection(collectionId: TCOLLECTIONID, itemId: TITEMID): DetailedResult<TCOMPOSITEID, ResultMapResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>TCOLLECTIONID</td><td>The collection ID.</td></tr>
<tr><td>itemId</td><td>TITEMID</td><td>The item ID.</td></tr>
</tbody></table>

**Returns:**

[DetailedResult](../../type-aliases/DetailedResult.md)&lt;TCOMPOSITEID, [ResultMapResultDetail](../../type-aliases/ResultMapResultDetail.md)&gt;

`Success` with the composite ID if deleted, `Failure` otherwise.
