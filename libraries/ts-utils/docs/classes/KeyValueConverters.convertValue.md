[Home](../README.md) > [KeyValueConverters](./KeyValueConverters.md) > convertValue

## KeyValueConverters.convertValue() method

Converts a supplied unknown to a valid value of type `<TV>`.

**Signature:**

```typescript
convertValue(key: unknown): DetailedResult<TV, ResultMapResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>unknown</td><td>The unknown to be converted.</td></tr>
</tbody></table>

**Returns:**

[DetailedResult](../type-aliases/DetailedResult.md)&lt;TV, [ResultMapResultDetail](../type-aliases/ResultMapResultDetail.md)&gt;

`Success` with the converted value and 'success' detail if the value is valid,
or `Failure` with an error message and 'invalid-value' detail if the value is invalid.
