[Home](../../README.md) > [Conversion](../README.md) > [Converter](./Converter.md) > convert

## Converter.convert() method

Converts from `unknown` to `<T>`.  For objects and arrays, is guaranteed
to return a new entity, with any unrecognized properties removed.

**Signature:**

```typescript
convert(from: unknown, context?: TC): Result<T>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>from</td><td>unknown</td><td>The `unknown` to be converted</td></tr>
<tr><td>context</td><td>TC</td><td>An optional conversion context of type `<TC>` to be used in
the conversion.</td></tr>
</tbody></table>

**Returns:**

[Result](../../type-aliases/Result.md)&lt;T&gt;

A Result with a Success and a value on success or an
Failure with a a message on failure.
