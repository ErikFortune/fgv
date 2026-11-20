[Home](../README.md) > [AggregatedResultMapBase](./AggregatedResultMapBase.md) > update

## AggregatedResultMapBase.update() method

Updates an existing item by its composite ID. Fails if the item doesn't exist.

**Signature:**

```typescript
update(key: TCOMPOSITEID, value: TITEM): DetailedResult<TITEM, ResultMapResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>TCOMPOSITEID</td><td>The composite ID of the item.</td></tr>
<tr><td>value</td><td>TITEM</td><td>The new value.</td></tr>
</tbody></table>

**Returns:**

[DetailedResult](../type-aliases/DetailedResult.md)&lt;TITEM, [ResultMapResultDetail](../type-aliases/ResultMapResultDetail.md)&gt;

`Success` with the value if updated, `Failure` otherwise.
