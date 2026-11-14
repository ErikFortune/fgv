[Home](../README.md) > [AggregatedResultMapBase](./AggregatedResultMapBase.md) > updateInCollection

## AggregatedResultMapBase.updateInCollection() method

Updates an item using separate collection and item IDs.

**Signature:**

```typescript
updateInCollection(collectionId: TCOLLECTIONID, itemId: TITEMID, value: TITEM): DetailedResult<TCOMPOSITEID, ResultMapResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>TCOLLECTIONID</td><td>The collection ID.</td></tr>
<tr><td>itemId</td><td>TITEMID</td><td>The item ID.</td></tr>
<tr><td>value</td><td>TITEM</td><td>The new value.</td></tr>
</tbody></table>

**Returns:**

[DetailedResult](../type-aliases/DetailedResult.md)&lt;TCOMPOSITEID, [ResultMapResultDetail](../type-aliases/ResultMapResultDetail.md)&gt;

`Success` with the composite ID if updated, `Failure` otherwise.
