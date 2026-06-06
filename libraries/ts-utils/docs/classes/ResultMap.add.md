[Home](../README.md) > [ResultMap](./ResultMap.md) > add

## ResultMap.add() method

Sets a key/value pair in the map if the key does not already exist.

**Signature:**

```typescript
add(key: TK, value: TV): DetailedResult<TV, ResultMapResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>TK</td><td>The key to set.</td></tr>
<tr><td>value</td><td>TV</td><td>The value to set.</td></tr>
</tbody></table>

**Returns:**

[DetailedResult](../type-aliases/DetailedResult.md)&lt;TV, [ResultMapResultDetail](../type-aliases/ResultMapResultDetail.md)&gt;

`Success` with the value and detail `added` if the key was added,
`Failure` with detail `exists` if the key already exists. Fails with detail
'invalid-key' or 'invalid-value' and an error message if either is invalid.
