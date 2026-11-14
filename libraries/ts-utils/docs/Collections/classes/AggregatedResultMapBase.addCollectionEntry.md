[Home](../../README.md) > [Collections](../README.md) > [AggregatedResultMapBase](./AggregatedResultMapBase.md) > addCollectionEntry

## AggregatedResultMapBase.addCollectionEntry() method

Adds a new collection from a pre-built entry object.

**Signature:**

```typescript
addCollectionEntry(entry: AggregatedResultMapEntryInit<TCOLLECTIONID, TITEMID, TITEM, TMETADATA>): DetailedResult<AggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM, TMETADATA>, ResultMapResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>entry</td><td>AggregatedResultMapEntryInit&lt;TCOLLECTIONID, TITEMID, TITEM, TMETADATA&gt;</td><td>The collection entry to add (JSON with items/entries, or pre-instantiated).</td></tr>
</tbody></table>

**Returns:**

[DetailedResult](../../type-aliases/DetailedResult.md)&lt;[AggregatedResultMapEntry](../../type-aliases/AggregatedResultMapEntry.md)&lt;TCOLLECTIONID, TITEMID, TITEM, TMETADATA&gt;, [ResultMapResultDetail](../../type-aliases/ResultMapResultDetail.md)&gt;

`Success` with the entry if added, `Failure` otherwise.
