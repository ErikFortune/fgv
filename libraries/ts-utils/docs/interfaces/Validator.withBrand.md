[Home](../README.md) > [Validator](./Validator.md) > withBrand

## Validator.withBrand() method

Creates a new Validation.Validator | in-place validator which
is derived from this one but which matches a branded result.

**Signature:**

```typescript
withBrand(brand: B): Validator<Brand<T, B>, TC>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>brand</td><td>B</td><td>The brand to be applied.</td></tr>
</tbody></table>

**Returns:**

[Validator](Validator.md)&lt;[Brand](../type-aliases/Brand.md)&lt;T, B&gt;, TC&gt;
