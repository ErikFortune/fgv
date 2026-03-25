[Home](../../README.md) > [Validation](../README.md) > [Validator](./Validator.md) > convert

## Validator.convert() method

Tests to see if a supplied 'unknown' value matches this validation.  In
contrast to Validator.validate | validate, makes no guarantees
about the identity of the returned value.

**Signature:**

```typescript
convert(from: unknown, context?: TC): Result<T>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>from</td><td>unknown</td><td>The `unknown` value to be tested.</td></tr>
<tr><td>context</td><td>TC</td><td>Optional validation context.</td></tr>
</tbody></table>

**Returns:**

[Result](../../type-aliases/Result.md)&lt;T&gt;

Success with the typed, conversion value,
or Failure with an error message if conversion fails.
