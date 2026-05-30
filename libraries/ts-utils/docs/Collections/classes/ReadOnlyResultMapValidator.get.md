[Home](../../README.md) > [Collections](../README.md) > [ReadOnlyResultMapValidator](./ReadOnlyResultMapValidator.md) > get

## ReadOnlyResultMapValidator.get() method

Gets a value from the map by key, validating the key first.

**Signature:**

```typescript
get(key: string): DetailedResult<TV, ResultMapResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>string</td><td>The key to retrieve (will be validated).</td></tr>
</tbody></table>

**Returns:**

[DetailedResult](../../type-aliases/DetailedResult.md)&lt;TV, [ResultMapResultDetail](../../type-aliases/ResultMapResultDetail.md)&gt;

`Success` with the value if found, `Failure` otherwise.
