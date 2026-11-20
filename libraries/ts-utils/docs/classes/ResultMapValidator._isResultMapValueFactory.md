[Home](../README.md) > [ResultMapValidator](./ResultMapValidator.md) > _isResultMapValueFactory

## ResultMapValidator._isResultMapValueFactory() method

Determines if a value is a Collections.ResultMapValueFactory | ResultMapValueFactory.

**Signature:**

```typescript
_isResultMapValueFactory(value: TV | ResultMapValueFactory<TK, TV>): value is ResultMapValueFactory<TK, TV>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>value</td><td>TV | ResultMapValueFactory&lt;TK, TV&gt;</td><td>The value to check.</td></tr>
</tbody></table>

**Returns:**

value is [ResultMapValueFactory](../type-aliases/ResultMapValueFactory.md)&lt;TK, TV&gt;

`true` if the value is a Collections.ResultMapValueFactory | ResultMapValueFactory,
`false` otherwise.
