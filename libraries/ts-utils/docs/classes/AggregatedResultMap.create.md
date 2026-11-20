[Home](../README.md) > [AggregatedResultMap](./AggregatedResultMap.md) > create

## AggregatedResultMap.create() method

Creates a new AggregatedResultMap | AggregatedResultMap.

**Signature:**

```typescript
static create(params: IAggregatedResultMapConstructorParams<TCOMPOSITEID, TCOLLECTIONID, TITEMID, TITEM, TMETADATA>): Result<AggregatedResultMap<TCOMPOSITEID, TCOLLECTIONID, TITEMID, TITEM, TMETADATA>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IAggregatedResultMapConstructorParams&lt;TCOMPOSITEID, TCOLLECTIONID, TITEMID, TITEM, TMETADATA&gt;</td><td>Parameters for constructing the map.</td></tr>
</tbody></table>

**Returns:**

[Result](../type-aliases/Result.md)&lt;[AggregatedResultMap](AggregatedResultMap.md)&lt;TCOMPOSITEID, TCOLLECTIONID, TITEMID, TITEM, TMETADATA&gt;&gt;

`Success` with the new map if successful, `Failure` otherwise.
