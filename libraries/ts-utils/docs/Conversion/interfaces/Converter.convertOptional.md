[Home](../../README.md) > [Conversion](../README.md) > [Converter](./Converter.md) > convertOptional

## Converter.convertOptional() method

Converts from `unknown` to `<T>` or `undefined`, as appropriate.

**Signature:**

```typescript
convertOptional(from: unknown, context?: TC, onError?: OnError): Result<T | undefined>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>from</td><td>unknown</td><td>The `unknown` to be converted</td></tr>
<tr><td>context</td><td>TC</td><td>An optional conversion context of type `<TC>` to be used in
the conversion.</td></tr>
<tr><td>onError</td><td>OnError</td><td>Specifies handling of values that cannot be converted (default `ignoreErrors`).</td></tr>
</tbody></table>

**Returns:**

[Result](../../type-aliases/Result.md)&lt;T | undefined&gt;

A Result with a Success and a value on success or an
Failure with a a message on failure.
