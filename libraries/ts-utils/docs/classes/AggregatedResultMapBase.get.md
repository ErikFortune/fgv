[Home](../README.md) > [AggregatedResultMapBase](./AggregatedResultMapBase.md) > get

## AggregatedResultMapBase.get() method

Gets an item by its composite ID.

**Signature:**

```typescript
get(key: TCOMPOSITEID): DetailedResult<TITEM, ResultMapResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>TCOMPOSITEID</td><td>The composite ID of the item.</td></tr>
</tbody></table>

**Returns:**

[DetailedResult](../type-aliases/DetailedResult.md)&lt;TITEM, [ResultMapResultDetail](../type-aliases/ResultMapResultDetail.md)&gt;

`Success` with the item if found, `Failure` otherwise.
