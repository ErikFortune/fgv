[Home](../README.md) > [AggregatedResultMapBase](./AggregatedResultMapBase.md) > composeId

## AggregatedResultMapBase.composeId() method

Composes a collection ID and item ID into a composite ID.

**Signature:**

```typescript
composeId(collectionId: TCOLLECTIONID, itemId: TITEMID): Result<TCOMPOSITEID>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>TCOLLECTIONID</td><td>The collection ID.</td></tr>
<tr><td>itemId</td><td>TITEMID</td><td>The item ID.</td></tr>
</tbody></table>

**Returns:**

[Result](../type-aliases/Result.md)&lt;TCOMPOSITEID&gt;

`Success` with the composite ID if valid, `Failure` otherwise.
