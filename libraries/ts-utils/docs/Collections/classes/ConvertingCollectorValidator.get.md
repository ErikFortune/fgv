[Home](../../README.md) > [Collections](../README.md) > [ConvertingCollectorValidator](./ConvertingCollectorValidator.md) > get

## ConvertingCollectorValidator.get() method

Gets a value by key.

**Signature:**

```typescript
get(key: string): DetailedResult<TITEM, ResultMapResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>string</td><td>The key to look up.</td></tr>
</tbody></table>

**Returns:**

[DetailedResult](../../type-aliases/DetailedResult.md)&lt;TITEM, [ResultMapResultDetail](../../type-aliases/ResultMapResultDetail.md)&gt;

Returns DetailedSuccess | Success with the value and detail `exists` if found,
or DetailedFailure | Failure with detail `not-found` if the key does not exist.
