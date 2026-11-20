[Home](../../README.md) > [Collections](../README.md) > [AggregatedResultMapBase](./AggregatedResultMapBase.md) > getOrAdd

## AggregatedResultMapBase.getOrAdd() method

Gets an existing item or adds a new one.

**Signature:**

```typescript
getOrAdd(key: TCOMPOSITEID, value: TITEM): DetailedResult<TITEM, ResultMapResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>TCOMPOSITEID</td><td>The composite ID of the item.</td></tr>
<tr><td>value</td><td>TITEM</td><td>The value to add if not found.</td></tr>
</tbody></table>

**Returns:**

[DetailedResult](../../type-aliases/DetailedResult.md)&lt;TITEM, [ResultMapResultDetail](../../type-aliases/ResultMapResultDetail.md)&gt;

`Success` with the existing or new value.
