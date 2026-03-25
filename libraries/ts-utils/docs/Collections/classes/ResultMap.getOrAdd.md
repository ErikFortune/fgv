[Home](../../README.md) > [Collections](../README.md) > [ResultMap](./ResultMap.md) > getOrAdd

## ResultMap.getOrAdd() method

Gets a value from the map, or adds a supplied value it if it does not exist.

**Signature:**

```typescript
getOrAdd(key: TK, value: TV): DetailedResult<TV, ResultMapResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>TK</td><td>The key to be retrieved or created.</td></tr>
<tr><td>value</td><td>TV</td><td>The value to add if the key does not exist.</td></tr>
</tbody></table>

**Returns:**

[DetailedResult](../../type-aliases/DetailedResult.md)&lt;TV, [ResultMapResultDetail](../../type-aliases/ResultMapResultDetail.md)&gt;

`Success` with the value and detail `exists` if the key was found,
`Success` with the value and detail `added` if the key was not found and added.
Fails with detail 'invalid-key' or 'invalid-value' and an error message if either
is invalid.
WITH_VALUE
