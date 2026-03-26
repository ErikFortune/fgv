[Home](../README.md) > [ReadOnlyConvertingResultMap](./ReadOnlyConvertingResultMap.md) > get

## ReadOnlyConvertingResultMap.get() method

Gets a converted value from the map by key.

**Signature:**

```typescript
get(key: TK): DetailedResult<TTARGET, ResultMapResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>TK</td><td>The key to retrieve.</td></tr>
</tbody></table>

**Returns:**

[DetailedResult](../type-aliases/DetailedResult.md)&lt;TTARGET, [ResultMapResultDetail](../type-aliases/ResultMapResultDetail.md)&gt;

`Success` with the converted value and detail `exists` if the key was found,
`Failure` with detail `not-found` if the key was not found, or `Failure` with
detail `invalid-value` if conversion failed.
