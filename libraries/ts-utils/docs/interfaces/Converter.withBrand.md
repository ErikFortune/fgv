[Home](../README.md) > [Converter](./Converter.md) > withBrand

## Converter.withBrand() method

returns a converter which adds a brand to the type to prevent mismatched usage
of simple types.

**Signature:**

```typescript
withBrand(brand: B): Converter<Brand<T, B>, TC>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>brand</td><td>B</td><td>The brand to be applied to the result value.</td></tr>
</tbody></table>

**Returns:**

[Converter](Converter.md)&lt;[Brand](../type-aliases/Brand.md)&lt;T, B&gt;, TC&gt;

A Converter returning `Brand<T, B>`.
