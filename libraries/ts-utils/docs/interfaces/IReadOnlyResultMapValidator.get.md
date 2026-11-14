[Home](../README.md) > [IReadOnlyResultMapValidator](./IReadOnlyResultMapValidator.md) > get

## IReadOnlyResultMapValidator.get() method

Gets a value from the map.

**Signature:**

```typescript
get(key: string): DetailedResult<TV, ResultMapResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>string</td><td>The key to retrieve.</td></tr>
</tbody></table>

**Returns:**

[DetailedResult](../type-aliases/DetailedResult.md)&lt;TV, [ResultMapResultDetail](../type-aliases/ResultMapResultDetail.md)&gt;

`Success` with the value and detail `exists` if the key was found,
`Failure` with detail `not-found` if the key was not found or with detail
`invalid-key` if the key is invalid.
