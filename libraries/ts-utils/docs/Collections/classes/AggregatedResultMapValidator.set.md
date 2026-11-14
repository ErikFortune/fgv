[Home](../../README.md) > [Collections](../README.md) > [AggregatedResultMapValidator](./AggregatedResultMapValidator.md) > set

## AggregatedResultMapValidator.set() method

Sets a key/value pair in the map.

**Signature:**

```typescript
set(key: string, value: unknown): DetailedResult<TITEM, ResultMapResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>string</td><td>The key to set.</td></tr>
<tr><td>value</td><td>unknown</td><td>The value to set.</td></tr>
</tbody></table>

**Returns:**

[DetailedResult](../../type-aliases/DetailedResult.md)&lt;TITEM, [ResultMapResultDetail](../../type-aliases/ResultMapResultDetail.md)&gt;

`Success` with the new value and the detail `updated` if the
key was found and updated, `Success` with the new value and detail
`added` if the key was not found and added.  Fails with detail
'invalid-key' or 'invalid-value' and an error message if either is invalid.
