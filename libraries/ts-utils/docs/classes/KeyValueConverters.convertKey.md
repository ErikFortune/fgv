[Home](../README.md) > [KeyValueConverters](./KeyValueConverters.md) > convertKey

## KeyValueConverters.convertKey() method

Converts a supplied unknown to a valid key value of type `<TK>`.

**Signature:**

```typescript
convertKey(key: unknown): DetailedResult<TK, ResultMapResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>unknown</td><td>The unknown to be converted.</td></tr>
</tbody></table>

**Returns:**

[DetailedResult](../type-aliases/DetailedResult.md)&lt;TK, [ResultMapResultDetail](../type-aliases/ResultMapResultDetail.md)&gt;

`Success` with the converted key value and 'success' detail if the key is valid,
or `Failure` with an error message and 'invalid-key' detail if the key is invalid.
