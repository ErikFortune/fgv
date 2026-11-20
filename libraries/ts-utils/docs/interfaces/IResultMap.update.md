[Home](../README.md) > [IResultMap](./IResultMap.md) > update

## IResultMap.update() method

Updates the value associated with a key in the map.

**Signature:**

```typescript
update(key: TK, value: TV): DetailedResult<TV, ResultMapResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>TK</td><td>The key to update.</td></tr>
<tr><td>value</td><td>TV</td><td>The value to set.</td></tr>
</tbody></table>

**Returns:**

[DetailedResult](../type-aliases/DetailedResult.md)&lt;TV, [ResultMapResultDetail](../type-aliases/ResultMapResultDetail.md)&gt;

`Success` with the value and detail 'updated' if the key was found
and the value updated, `Failure` an error message and with detail `not-found`
if the key was not found, or with detail 'invalid-key' or 'invalid-value'
if either is invalid.
