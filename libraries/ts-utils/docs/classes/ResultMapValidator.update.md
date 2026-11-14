[Home](../README.md) > [ResultMapValidator](./ResultMapValidator.md) > update

## ResultMapValidator.update() method

Updates an existing key in the map - the map is not updated if the key does
not exist.

**Signature:**

```typescript
update(key: string, value: unknown): DetailedResult<TV, ResultMapResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>string</td><td>The key to update.</td></tr>
<tr><td>value</td><td>unknown</td><td>The value to set.</td></tr>
</tbody></table>

**Returns:**

[DetailedResult](../type-aliases/DetailedResult.md)&lt;TV, [ResultMapResultDetail](../type-aliases/ResultMapResultDetail.md)&gt;

`Success` with the value and detail 'exists' if the key was found
and the value updated, `Failure` an error message and with detail `not-found`
if the key was not found, or with detail 'invalid-key' or 'invalid-value'
if either is invalid.
