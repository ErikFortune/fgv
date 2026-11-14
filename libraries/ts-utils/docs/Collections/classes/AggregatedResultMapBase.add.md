[Home](../../README.md) > [Collections](../README.md) > [AggregatedResultMapBase](./AggregatedResultMapBase.md) > add

## AggregatedResultMapBase.add() method

Adds an item by its composite ID. Fails if the item already exists.

**Signature:**

```typescript
add(key: TCOMPOSITEID, value: TITEM): DetailedResult<TITEM, ResultMapResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>TCOMPOSITEID</td><td>The composite ID of the item.</td></tr>
<tr><td>value</td><td>TITEM</td><td>The value to add.</td></tr>
</tbody></table>

**Returns:**

[DetailedResult](../../type-aliases/DetailedResult.md)&lt;TITEM, [ResultMapResultDetail](../../type-aliases/ResultMapResultDetail.md)&gt;

`Success` with the value if added, `Failure` otherwise.
